import minicart from "../../../fixtures/minicart"
import selectors from "../../../fixtures/hyva/selectors/minicart"

describe('Mini cart tests', () => {
    /**
     * Opens the minicart slider and waits for it to be visible.
     */
    const openMiniCart = () => {
        cy.get(selectors.miniCartButton).click();
        cy.get(selectors.miniCartSlider).should('be.visible');
    };

    beforeEach(() => {
        cy.visit(minicart.didiSportWatch);
        cy.get(selectors.addToCartButton).click();
        openMiniCart();
    });

    it('Can delete an item from the cart slider', () => {
        cy.get(selectors.removeProductButton).click();
        cy.get(selectors.miniCartSlider).should('contain.text', 'Cart is empty');
    });

    it('Can navigate to the product when clicking the edit icon', () => {
        // Capture the product name from the minicart
        cy.get(selectors.miniCartProductName)
            .first()
            .invoke('text')
            .then((text) => text.trim())
            .as('miniCartProductName');

        // Click edit and verify PDP shows the same product
        cy.get(selectors.miniCartEditProductButton).click();
        cy.get('@miniCartProductName').then((expectedName) => {
            cy.get(selectors.PDPProductName)
                .invoke('text')
                .then((text) => text.trim())
                .should('equal', expectedName);
        });
    });

    it('Can navigate to the cart with a link in the slider', () => {
        cy.get(selectors.miniCartViewCartLink).click();
        cy.get(selectors.pageTitle)
            .should('contain.text', 'Shopping Cart')
            .should('be.visible');
    });

    it('Can navigate to the checkout with a link in the slider', () => {
        cy.get(selectors.miniCartCheckoutButton).click();
        cy.title().should('eq', 'Checkout');
    });

    it('Can change amount in the minicart', () => {
        // Navigate to product page via edit button
        cy.get(selectors.miniCartSlider).within(() => {
            cy.get(selectors.miniCartEditProductButton).click();
        });

        // Change quantity to 2 and add to cart
        cy.get(selectors.qtyInputField).clear();
        cy.get(selectors.qtyInputField).type('2{enter}');
        cy.get(selectors.qtyInputField).should('have.value', '2');
        cy.get(selectors.addToCartButton).click();

        // Verify minicart shows updated quantity
        openMiniCart();
        cy.get(selectors.productQty).should('have.text', '2');
    });
});

describe('Mini cart price verification', () => {
    /**
     * Extracts numeric price from a string like "$92.00".
     */
    const parsePrice = (priceString) => {
        const match = priceString.match(/([\d.]+)/);
        return match ? parseFloat(match[1]) : 0;
    };

    /**
     * Opens the minicart slider and waits for it to be visible.
     */
    const openMiniCart = () => {
        cy.get(selectors.miniCartButton).click();
        cy.get(selectors.miniCartSlider).should('be.visible');
    };

    it('Displays correct prices and calculates subtotal correctly', () => {
        // Step 1: Visit product page and capture its price
        cy.visit(minicart.waterBottle);
        cy.get(selectors.productPrice)
            .invoke('text')
            .then(parsePrice)
            .as('pdpPrice');

        // Step 2: Add to cart and open minicart
        cy.get(selectors.addToCartButton).click();
        openMiniCart();

        // Step 3: Verify minicart shows the same price as PDP
        cy.get('@pdpPrice').then((expectedPrice) => {
            cy.get(selectors.miniCartProductPrice)
                .first()
                .invoke('text')
                .then(parsePrice)
                .should('equal', expectedPrice);
        });

        // Step 4: Verify subtotal = price × quantity
        cy.get(selectors.miniCartProductPrice).first().invoke('text').then(parsePrice).as('itemPrice');
        cy.get(selectors.firstProductAmount).invoke('text').then((text) => parseInt(text.trim(), 10)).as('itemQty');
        cy.get(selectors.miniCartSubtotal).invoke('text').then(parsePrice).as('subtotal');

        cy.then(function () {
            const expectedSubtotal = this.itemPrice * this.itemQty;
            expect(this.subtotal).to.equal(expectedSubtotal);
        });
    });
});
