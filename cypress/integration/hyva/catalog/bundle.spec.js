import product from "../../../fixtures/hyva/product.json";
import selectors from "../../../fixtures/hyva/selectors/product.json";
import homepageSelectors from "../../../fixtures/hyva/selectors/homepage.json";

/**
 * Extracts numeric price from a price string (e.g., "$12.34" -> 12.34)
 */
function parsePrice(priceText) {
    const match = priceText.match(/[\d.]+/)
    return match ? parseFloat(match[0]) : 0
}

/**
 * Sets the quantity for all bundle option inputs and waits for Alpine to update the summary.
 * @param {number|function} qtyOrFn - Either a fixed quantity or a function(index) returning quantity
 */
function setBundleOptionQuantities(qtyOrFn) {
    const getQty = typeof qtyOrFn === 'function' ? qtyOrFn : () => qtyOrFn

    cy.get(selectors.bundleOptionQtyInputs).each(($input, idx) => {
        const qty = String(getQty(idx))
        cy.wrap($input).as('currentInput')
        cy.get('@currentInput').clear()
        cy.get('@currentInput').type(qty)
        cy.get('@currentInput').blur()
    })

    // Wait for Alpine to process changes by checking the summary has updated
    cy.get(selectors.bundleSummaryFinalPrice).should('be.visible')
}

describe('Bundle products test suite', () => {
    beforeEach(() => {
        cy.visit(product.bundledProductUrl);
    });

    it('Can render the product name', () => {
        cy.get(selectors.mainHeading)
            .should('be.visible')
            .and('contain.text', product.bundledProductName)
    })

    it('Can calculate the price based on selected options', () => {
        // Collect prices from all first options
        cy.get(selectors.bundleOptionControls).then(($options) => {
            const prices = []

            $options.each((idx, option) => {
                const priceWrapper = option.querySelector(selectors.bundleOptionPriceWrapper)
                if (priceWrapper) {
                    prices.push(parsePrice(priceWrapper.innerText))
                }
            })

            // Store expected total for later assertion
            cy.wrap(prices.reduce((sum, n) => sum + n, 0)).as('expectedTotal')
        })

        setBundleOptionQuantities(1)

        cy.get('@expectedTotal').then((expectedTotal) => {
            cy.get(selectors.bundleSummaryFinalPrice)
                .first()
                .should('contain.text', `$${expectedTotal}`)
        })
    })

    it('Can display selection quantities', () => {
        // Collect expected product names from labels
        cy.get(selectors.bundleOptionLabels).then(($labels) => {
            const names = [...$labels].map(label => label.innerText.trim())
            cy.wrap(names).as('expectedNames')
        })

        // Set quantities to 1, 2, 3, etc.
        setBundleOptionQuantities((idx) => idx + 1)

        // Verify product names appear in correct order
        cy.get('@expectedNames').then((expectedNames) => {
            cy.get(selectors.bundleSummaryItemNames).each(($name, idx) => {
                expect($name.text()).to.eq(expectedNames[idx])
            })
        })

        // Verify quantities are 1, 2, 3, etc.
        cy.get(selectors.bundleSummaryItemQtys).each(($qty, idx) => {
            expect($qty.text()).to.eq(String(idx + 1))
        })
    })

    it('Can add a bundled product to the cart', () => {
        setBundleOptionQuantities(1)

        cy.get(selectors.addToCartButton).click()

        cy.get(homepageSelectors.successMessage)
            .should('contain.text', `You added ${product.bundledProductName} to your shopping cart.`)

        cy.get(selectors.cartIconProductCount)
            .should('not.be.empty')
            .invoke('text')
            .then(parseFloat)
            .should('be.gte', 1)
    })
})
