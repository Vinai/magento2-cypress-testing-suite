import product from "../../../fixtures/hyva/product.json";
import selectors from "../../../fixtures/hyva/selectors/product.json";
import homepageSelectors from "../../../fixtures/hyva/selectors/homepage.json";

describe('Bundle products test suite', () => {
    /**
     * Extracts a numeric price from a string like "$45.00" or "45.00".
     */
    const parsePrice = (priceString) => {
        const match = priceString.match(/([\d.]+)/);
        return match ? parseFloat(match[1]) : 0;
    };

    /**
     * Sets the quantity for all bundle option inputs and waits for Alpine.js to process.
     * @param {number|function} qtyOrFn - Either a fixed quantity or a function(index) returning qty
     */
    const setBundleQuantities = (qtyOrFn) => {
        cy.get(selectors.bundle.qtyInputs).each((input, idx) => {
            const qty = typeof qtyOrFn === 'function' ? qtyOrFn(idx) : qtyOrFn;
            cy.wrap(input).clear();
            cy.wrap(input).type(`${qty}`).blur();
        });
        // Allow Alpine.js to process the change events
        cy.wait(100);
    };

    beforeEach(() => {
        cy.visit(product.bundledProductUrl);
    });

    it('Can render the product name', () => {
        cy.get(selectors.mainHeading)
            .should('contain.text', product.bundledProductName)
            .should('be.visible');
    });

    it('Can calculate the price based on selected options', () => {
        // Step 1: Collect the price of the first option for each bundle component
        cy.get(selectors.bundle.optionControls).then(($options) => {
            const optionPrices = Array.from($options).map((option) => {
                const priceEl = option.querySelector(selectors.bundle.optionPrice);
                return priceEl ? parsePrice(priceEl.innerText) : 0;
            });
            const expectedTotal = optionPrices.reduce((sum, price) => sum + price, 0);

            // Step 2: Set quantity to 1 for each bundle option
            setBundleQuantities(1);

            // Step 3: Verify the summary shows the correct total price
            cy.get(selectors.bundle.summaryFinalPrice)
                .first()
                .should('contain.text', `$${expectedTotal}`);
        });
    });

    it('Can display selection quantities', () => {
        // Step 1: Capture the expected product names from the option legends
        cy.get(selectors.bundle.optionLegends).then(($legends) => {
            const expectedNames = Array.from($legends).map((el) => el.innerText.trim());

            // Step 2: Set quantities to 1, 2, 3... for each option
            setBundleQuantities((idx) => idx + 1);

            // Step 3: Verify product names in summary match the expected order
            cy.get(selectors.bundle.summaryItemNames).each(($name, idx) => {
                expect($name.text()).to.eq(expectedNames[idx]);
            });

            // Step 4: Verify quantities in summary are 1, 2, 3...
            cy.get(selectors.bundle.summaryItemQty).each(($qty, idx) => {
                expect($qty.text()).to.eq(`${idx + 1}`);
            });
        });
    });

    it('Can add a bundled product to the cart', () => {
        // Step 1: Set all bundle option quantities to 1
        setBundleQuantities(1);

        // Step 2: Click add to cart and verify success message
        cy.get(selectors.addToCartButton).click();
        cy.get(homepageSelectors.successMessage).should(
            'contain.text',
            `You added ${product.bundledProductName} to your shopping cart.`
        );

        // Step 3: Verify cart icon updates with product count
        // Use a custom assertion that retries until cart count is at least 1
        cy.get(selectors.cartIconProductCount).should(($el) => {
            const count = parseFloat($el.text()) || 0;
            expect(count).to.be.gte(1);
        });
    });
});
