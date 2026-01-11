import product from '../../../fixtures/hyva/product.json';
import account from '../../../fixtures/account.json';
import selectors from '../../../fixtures/hyva/selectors/product.json';
import homepageSelectors from '../../../fixtures/hyva/selectors/homepage.json';
import { Account } from '../../../page-objects/hyva/account';

/**
 * Selects a product attribute option by index and verifies it's checked
 */
function selectAttributeOption(attributeIndex) {
    cy.get(selectors.productAttributeSelector)
        .eq(attributeIndex)
        .click()

    cy.get(selectors.productAttributeSelector)
        .eq(attributeIndex)
        .find('input')
        .first()
        .should('be.checked')
}

describe('Simple Product test suite', () => {
    beforeEach(() => {
        cy.visit(product.simpleProductUrl);
    });

    it('Can see a title and image for the product', () => {
        cy.get(selectors.mainHeading)
            .should('be.visible')
            .and('contain.text', product.simpleProductName)

        cy.get(selectors.productImage)
            .should('have.attr', 'src')
            .and('include', 'media/catalog/product')
    });

    it('Can see a price for the product', () => {
        cy.get(selectors.productPrice)
            .invoke('text')
            .should('match', new RegExp(product.priceRegexp))
    });

    it('Can add a product to the cart from the product page', () => {
        cy.get(selectors.addToCartButton).click()

        cy.get(homepageSelectors.successMessage)
            .should('contain.text', `You added ${product.simpleProductName} to your shopping cart.`)

        cy.get(selectors.cartIconProductCount)
            .should('not.be.empty')
            .invoke('text')
            .then(parseFloat)
            .should('be.gte', 1)
    });

    it('Can see breadcrumbs', () => {
        cy.get(selectors.breadCrumbItems).should('have.length.gte', 2)
    });

    it("Can't add a product to a wishlist when not logged in", () => {
        cy.get(selectors.addToWishlistButton).click()

        cy.get(selectors.errorMessage)
            .should('contain.text', 'You must login or register to add items to your wishlist.')
    });

    it(['hot'], 'Can add a product to the wishlist when customer is logged in', () => {
        const customerEmail = `${Date.now()}${account.customer.customer.email}`

        cy.visit(account.routes.accountCreate)
        Account.createNewCustomer(
            account.customer.customer.firstname,
            account.customer.customer.lastname,
            customerEmail,
            account.customer.password
        )

        cy.visit(product.simpleProductUrl)
        cy.get(selectors.addToWishlistButton).click()

        cy.get(homepageSelectors.successMessage)
            .should('be.visible')
            .and('contain.text', `${product.simpleProductName} has been added to your Wish List.`)
    });

    it('Can see product review score and the individual reviews', () => {
        cy.get(selectors.productRatingStar).should('have.length', 5)

        cy.get(selectors.customerReviewTitle)
            .should('contain.text', 'Customer Reviews')

        cy.get(selectors.productCustomerReviews).should('have.length.gte', 1)
    });

    it('Can add reviews to a product', () => {
        cy.get(selectors.productCustomerReviewForm)
            .should('contain.text', `You're reviewing:`)
            .and('contain.text', product.simpleProductName)

        cy.get(selectors.reviewReviewerNameField).type('Someone')
        cy.get(selectors.reviewReviewerNameField).should('have.value', 'Someone')

        cy.get(selectors.reviewSummeryField).type('Something')
        cy.get(selectors.reviewSummeryField).should('have.value', 'Something')

        cy.get(selectors.reviewReviewField).type('Longer something')
        cy.get(selectors.reviewReviewField).should('have.value', 'Longer something')

        cy.get(selectors.reviewFiveStarScore).click()
        cy.get(selectors.reviewFifthStarInput).should('be.checked')

        cy.get(selectors.reviewSubmitButton).click()

        cy.get(selectors.reviewSubmittedSuccessMessage)
            .should('contain.text', 'You submitted your review for moderation.')
    });

    it('Can see that a product is in stock', () => {
        cy.get(selectors.productStockMessage)
            .should('contain.text', 'In stock')
    });

    it('Can increment the product quantity on the pdp', () => {
        cy.get(selectors.productQty).type('{uparrow}')
        cy.get(selectors.productQty).should('have.value', '2')
    });
});

describe('Configurable products test suite', () => {
    beforeEach(() => {
        cy.visit(product.configurableProductUrl);
    });

    it('Can find products in the related products list', () => {
        cy.get(selectors.relatedProductsTitle)
            .should('contain.text', 'Related Products')

        cy.get(selectors.relatedProductsCard).should('have.length.gte', 3)
    });

    it("Can't add a configurable product to the cart without selecting options", () => {
        cy.get(selectors.addToCartButton).click()

        // HTML5 form validation marks unselected required options as invalid
        cy.get(selectors.forgottenField).should('exist')
    });

    it('Can select product attributes', () => {
        selectAttributeOption(0)
        selectAttributeOption(1)
    });
});
