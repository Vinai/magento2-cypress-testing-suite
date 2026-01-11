import { Account } from '../../../page-objects/hyva/account';
import { Magento2RestApi } from '../../../support/magento2-rest-api';
import account from '../../../fixtures/account.json';
import product from '../../../fixtures/hyva/product.json';
import checkout from '../../../fixtures/checkout.json';
import selectors from '../../../fixtures/hyva/selectors/account.json';
import checkoutSelectors from '../../../fixtures/hyva/selectors/checkout.json';
import productSelectors from '../../../fixtures/hyva/selectors/product.json';
import homepageSelectors from '../../../fixtures/hyva/selectors/homepage.json';
import cart from '../../../fixtures/hyva/selectors/cart.json';
import { Cart } from '../../../page-objects/hyva/cart';

describe(['hot'], 'Account creation', () => {
    it('Can create an account', () => {
        const uniqueEmail = `${Date.now()}${account.customer.customer.email}`;

        cy.visit(account.routes.accountCreate);
        Account.createNewCustomer(
            account.customer.customer.firstname,
            account.customer.customer.lastname,
            uniqueEmail,
            account.customer.password
        );

        cy.contains('Thank you for registering with Main Website Store.').should('exist');
    });
});

describe(['hot'], 'Account activities', () => {
    before(() => {
        Magento2RestApi.createCustomerAccount(account.customer);
        Account.login(account.customer.customer.email, account.customer.password);
        Account.createAddress(account.customerInfo);
        Account.logout();
    });

    beforeEach(() => {
        Account.login(account.customer.customer.email, account.customer.password);
        cy.contains('Please wait and try again later.').should('not.exist');
    });

    after(() => {
        // Ensure we're logged in before cleanup
        cy.visit(account.routes.accountUrl);
        cy.get(selectors.accountPageHeading).then(($heading) => {
            if ($heading.text().trim() !== 'My Account') {
                Account.login(account.customer.customer.email, account.customer.password);
            }
        });

        // Remove the added address
        cy.visit('/customer/address');
        cy.get(selectors.deleteAddressButton).eq(0).click();
        cy.on('window:confirm', () => true);
    });

    it('Can check your profile', () => {
        cy.visit(account.routes.accountEdit);
        Account.checkAllProfileSpecs();
    });

    it('Can change password', () => {
        const { password: originalPassword } = account.customer;
        const { password: tempPassword } = account.tempCustomerInfo;

        cy.visit(account.routes.accountEdit);
        cy.contains('Change Password').click();
        cy.contains('Current Password').should('be.visible');
        cy.contains('New Password').should('be.visible');

        // Change to temporary password
        cy.contains('Change Password').click();
        Account.changePassword(originalPassword, tempPassword);
        cy.contains('You saved the account information.').should('exist');

        // Login with new password and change back
        Account.login(account.customer.customer.email, tempPassword);
        cy.visit(account.routes.accountEdit);
        Account.changePassword(tempPassword, originalPassword);
        cy.contains('You saved the account information.').should('exist');
    });

    it('Can change the profile values', () => {
        const tempFirstname = account.tempCustomerInfo.firstname;
        const tempLastname = account.tempCustomerInfo.lastname;
        const originalFirstname = account.customer.customer.firstname;
        const originalLastname = account.customer.customer.lastname;

        // Change to temp values
        cy.visit(account.routes.accountEdit);
        Account.changeProfileValues(tempFirstname, tempLastname);

        Account.goToProfile();
        cy.get(selectors.accountFirstnameInputSelector).should('have.value', tempFirstname);
        cy.get(selectors.accountLastnameInputSelector).should('have.value', tempLastname);

        // Change back to original values
        cy.visit(account.routes.accountEdit);
        Account.changeProfileValues(originalFirstname, originalLastname);

        cy.visit(account.routes.accountEdit);
        cy.get(selectors.accountFirstnameInputSelector).should('have.value', originalFirstname);
        cy.get(selectors.accountLastnameInputSelector).should('have.value', originalLastname);
    });

    it('Can view order history', function () {
        cy.visit(account.routes.accountOrderHistory);

        cy.get(selectors.accountMainContent).then(($column) => {
            if ($column.find(selectors.ordersCountToolbar).length) {
                cy.get(selectors.ordersCountToolbar)
                    .invoke('text')
                    .then((text) => {
                        const orderCount = parseInt(text.trim(), 10);
                        expect(orderCount).to.be.at.least(1);
                    });
            } else {
                cy.contains('You have placed no orders.').should('exist');
            }
        });
    });

    it('Can add an address', () => {
        cy.visit(account.routes.accountAddAddress);
        Account.createAddress(account.customerInfo);

        cy.contains(selectors.addNewAddressButton, 'Add New Address').click();

        cy.get(selectors.newAddressStreetInput).type(account.customerInfo.streetAddress);
        cy.get(selectors.newAddressCityInput).type(account.customerInfo.city);
        cy.get(selectors.newAddressTelInput).type(account.customerInfo.phone);
        cy.get(selectors.newAddressZipcodeInput).type(account.customerInfo.zip);
        cy.get(selectors.newAddressCountryInput).select(account.customerInfo.country);
        cy.get(selectors.newAddressRegionInput).type(account.customerInfo.state);
        cy.get(selectors.newAddressBillingInput).check();
        cy.get(selectors.newAddressShippingInput).check();

        cy.contains('Save Address').click();
    });

    it('Can change an address', () => {
        const timestamp = Date.now().toString();

        cy.visit(account.routes.accountAddresses);
        cy.get(selectors.editAddress).first().click();
        cy.get(selectors.addressEditStreetInput).eq(0).type(timestamp);
        cy.get(selectors.saveAddressButton).contains('Save Address').click();

        cy.contains('You saved the address.').should('exist');
    });

    if (!Cypress.env('MAGENTO2_SKIP_CHECKOUT')) {
        it('Can use saved address at checkout', () => {
            cy.visit(product.simpleProductUrl);
            cy.contains('Add to Cart').click();

            cy.visit(checkout.checkoutUrl);
            cy.get(selectors.checkoutSavedAddressOption).should('have.length.above', 1);
        });
    }

    it('Can remove an address', () => {
        Account.createAddress(account.customerInfo);
        cy.visit(account.routes.accountAddresses);

        cy.get(selectors.deleteAddressButton).last().click();
        cy.on('window:confirm', (str) => {
            expect(str.trim()).to.eq('Are you sure you want to delete this address?');
            return true;
        });

        cy.contains('You deleted the address.').should('exist');
    });

    it('Can change the newsletter subscription', () => {
        cy.visit(account.routes.manageNewsletter);
        cy.contains('General Subscription').click();
        cy.get(selectors.subscriptionSaveButton).click();

        cy.get(homepageSelectors.successMessage).should('contain.text', 'We have');
    });

    it('Can add a product to a wishlist', () => {
        cy.visit(product.simpleProductUrl);
        cy.get(productSelectors.addToWishlistButton).eq(0).click();

        cy.get(homepageSelectors.mainHeading).should('contain.text', 'My Wish List');

        cy.visit(product.wishlistUrl);
        cy.get(selectors.wishlistItemCount).should('exist');
        cy.contains(product.simpleProductName).should('exist');
    });

    it('Can edit the wishlist and remove item', () => {
        cy.visit(product.wishlistUrl);

        // Add comment
        cy.get(selectors.wishlistItemCommentField).first().type('foobar');
        cy.get(selectors.wishlistUpdateButton).click();
        cy.get(selectors.wishlistItemCommentField).should('contain.text', 'foobar');

        // Verify quantity
        cy.get(selectors.wishlistQtyField)
            .first()
            .should(($qty) => {
                expect($qty[0].valueAsNumber).to.be.at.least(1);
            });

        // Test share functionality
        cy.get(selectors.wishlistShareButton).click();
        cy.get(homepageSelectors.mainHeading).should('contain.text', 'Wish List Sharing');
        cy.get(selectors.wishlistShareBackLink).click();

        // Remove item
        cy.get(selectors.wishlistRemoveItemButton).first().click();
        cy.get(homepageSelectors.successMessage)
            .should('contain.text', `${product.simpleProductName} has been removed from your Wish List.`);
    });

    it('Can log out', () => {
        cy.get(selectors.accountIcon).click();
        cy.get(selectors.accountMenuItems).contains('Sign Out').click();

        cy.get(homepageSelectors.mainHeading).should('contain.text', 'You have signed out');
    });
});

describe('Customer cart', () => {
    it('Merges an existing cart when a customer logs in', () => {
        Cart.addProductToCart(cart.url.product1Url);
        cy.visit(cart.url.cartUrl);

        cy.get(cart.productNameInCart).invoke('text').as('productName');

        cy.get('@productName').then((productName) => {
            Account.login(account.customerLogin.username, account.customerLogin.password);
            cy.visit(cart.url.cartUrl);
            cy.get(cart.productNameInCart).should('have.text', productName);
        });

        Account.logout();
    });
});

describe(['hot'], 'Guest user test', () => {
    it('Can login from cart', () => {
        cy.visit(product.simpleProductUrl);
        cy.get(checkoutSelectors.addToCartButton).click();

        cy.get(selectors.successMessageCartLink).contains('shopping cart').click();

        cy.visit(account.routes.accountIndex);
        Account.login(account.customer.customer.email, account.customer.password);

        cy.get(selectors.messageContents).should('not.exist');

        cy.get(checkoutSelectors.miniCartIcon).click();
        cy.get(checkoutSelectors.cartDrawerEditLink).contains('View and Edit Cart').click();

        cy.get(checkoutSelectors.productQuantityField).should(($input) => {
            expect($input[0].valueAsNumber).to.be.at.least(1);
        });
        cy.contains(product.simpleProductName).should('exist');
    });

    if (!Cypress.env('MAGENTO2_SKIP_CHECKOUT')) {
        it('Can login from checkout', () => {
            cy.visit(product.simpleProductUrl);
            cy.get(checkoutSelectors.addToCartButton).should('contain.text', 'Add to Cart');
            cy.get(checkoutSelectors.addToCartButton).click();

            cy.visit(checkout.checkoutUrl);
            cy.get(checkoutSelectors.checkoutLoginToggle).click();

            cy.get(checkoutSelectors.checkoutEmailLabel).click();
            cy.get(checkoutSelectors.checkoutEmailLabel).type(account.customer.customer.email);

            cy.get(checkoutSelectors.checkoutPasswordLabel).click();
            cy.get(checkoutSelectors.checkoutPasswordLabel).type(account.customer.password);

            cy.get(checkoutSelectors.checkoutLoginButton).click();

            cy.get(checkoutSelectors.checkoutLoggedInEmail)
                .should('contain.text', account.customer.customer.email);

            cy.get(selectors.messageContents).should('not.exist');
        });
    }
});
