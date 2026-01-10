import product from '../../../fixtures/hyva/product.json';
import account from '../../../fixtures/account.json';
import selectors from '../../../fixtures/hyva/selectors/product.json';
import homepageSelectors from '../../../fixtures/hyva/selectors/homepage.json';
import { Account } from '../../../page-objects/hyva/account';
import { Magento2RestApi } from '../../../support/magento2-rest-api';

describe('Simple Product test suite', () => {
    beforeEach(() => {
        cy.visit(product.simpleProductUrl);
    });

    it('Can see a title and image for the product', () => {
        cy.get(selectors.mainHeading)
            .should('contain.text', product.simpleProductName)
            .should('be.visible');

        cy.get(selectors.productImage)
            .should('have.attr', 'src')
            .should('include', 'media/catalog/product');
    });

    it('Can see a price for the product', () => {
        // Verify price contains currency symbol and matches expected format (e.g., "$92.00")
        const priceRegex = new RegExp(product.priceRegexp);

        cy.get(selectors.productPrice)
            .should('contain', product.currency)
            .invoke('text')
            .should('match', priceRegex);
    });

    it('Can add a product to the cart from the product page', () => {
        cy.get(selectors.addToCartButton).click();

        // Verify success message appears
        cy.get(homepageSelectors.successMessage).should(
            'contain.text',
            `You added ${product.simpleProductName} to your shopping cart.`
        );

        // Verify cart icon shows at least 1 item (with retry)
        cy.get(selectors.cartIconProductCount).should(($el) => {
            const count = parseFloat($el.text()) || 0;
            expect(count).to.be.gte(1);
        });
    });

    it('Can see breadcrumbs', () => {
        cy.get(selectors.breadCrumbItems).should('have.length.gte', 2);
    });

    it("Can't add a product to a wishlist when not logged in", () => {
        cy.get(selectors.addToWishlistButton).click();

        cy.get(selectors.errorMessage, { timeout: 7000 })
            .should('be.visible')
            .should('contain.text', 'You must login or register to add items to your wishlist.');
    });

    it(
        ['hot'],
        'Can add a product to the wishlist when customer is logged in',
        () => {
            // Create a new customer account
            const customerEmail = Date.now() + account.customer.customer.email;
            cy.visit(account.routes.accountCreate);
            Account.createNewCustomer(
                account.customer.customer.firstname,
                account.customer.customer.lastname,
                customerEmail,
                account.customer.password
            );

            // Navigate to product and add to wishlist
            cy.visit(product.simpleProductUrl);
            cy.get(selectors.addToWishlistButton).click();

            // Verify success message
            cy.get(homepageSelectors.successMessage)
                .should('be.visible')
                .should('include.text', `${product.simpleProductName} has been added to your Wish List.`);
        }
    );

    it('Can see product review score and individual reviews', () => {
        // Verify 5-star rating display
        cy.get(selectors.productRatingStar).should('have.length', 5);

        // Verify reviews section exists
        cy.get(selectors.customerReviewTitle)
            .should('be.visible')
            .should('include.text', 'Customer Reviews');

        // Verify at least one review is displayed
        cy.get(selectors.productCustomerReviews).should('have.length.gte', 1);
    });

    it('Can add a review to a product', () => {
        // Verify review form shows correct product name
        cy.get(selectors.productCustomerReviewForm).should('be.visible');
        cy.get(selectors.productCustomerReviewForm).invoke('text').should('include', product.simpleProductName);

        // Fill in review form
        cy.get(selectors.reviewReviewerNameField).type('Someone');
        cy.get(selectors.reviewSummeryField).type('Something');
        cy.get(selectors.reviewReviewField).type('Longer something');

        // Select 5-star rating
        cy.get(selectors.reviewFiveStarScore).click();
        cy.get(selectors.reviewFifthStarInput).should('be.checked');

        // Submit and verify success message
        cy.get(selectors.reviewSubmitButton).click();
        cy.get(selectors.reviewSubmittedSuccessMessage)
            .should('be.visible')
            .should('contain.text', 'You submitted your review for moderation.');
    });

    it('Can see that a product is in stock', () => {
        cy.get(selectors.productStockMessage)
            .should('be.visible')
            .should('contain.text', 'In stock');
    });

    /* This test requires an admin token in cypress.env.json and reindexing after update */
    // if (Cypress.env('MAGENTO2_ADMIN_TOKEN')) {
    //     it(["hot"], "Can't add an out of stock product to the cart", () => {
    //         Magento2RestApi.updateProductQty(product.outOfStockProductSku, 0);
    //         cy.visit(product.outOfStockProductUrl);
    //         cy.get(selectors.productStockMessage)
    //             .should('be.visible')
    //             .should('contain.text', 'Out of stock');
    //         cy.get(selectors.addToCartButton).should('not.exist');
    //     });
    // }

    it('Can increment the product quantity on the PDP', () => {
        cy.get(selectors.productQty).type('{uparrow}');
        cy.get(selectors.productQty).should('have.value', '2');
    });
});

describe('Configurable products test suite', () => {
    /**
     * Selects a product attribute option by index and verifies it becomes checked.
     */
    const selectAttributeOption = (attributeIndex) => {
        cy.get(selectors.productAttributeSelector).eq(attributeIndex).click();
        cy.get(selectors.productAttributeSelector)
            .eq(attributeIndex)
            .find('input')
            .first()
            .should('be.checked');
    };

    beforeEach(() => {
        cy.visit(product.configurableProductUrl);
    });

    it('Can find products in the related products list', () => {
        cy.get(selectors.relatedProductsTitle)
            .should('be.visible')
            .should('contain.text', 'Related Products');

        cy.get(selectors.relatedProductsCard).should('have.length.gte', 3);
    });

    it("Can't add a configurable product to the cart without selecting options", () => {
        cy.get(selectors.addToCartButton).click();

        // HTML5 form validation marks the field as invalid when required option is missing
        cy.get(selectors.forgottenField).should('exist');
    });

    it('Can select product attributes', () => {
        // Select first attribute option (e.g., Size)
        selectAttributeOption(0);

        // Select second attribute option (e.g., Color)
        selectAttributeOption(1);
    });
});
