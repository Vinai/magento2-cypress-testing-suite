import minicart from "../../../fixtures/minicart"
import selectors from "../../../fixtures/hyva/selectors/minicart"

/**
 * Extracts numeric price from a price string (e.g., "$12.34" -> 12.34)
 */
function parsePrice(priceText) {
    return parseFloat(priceText.replace(/[^0-9.]/g, ''))
}

/**
 * Opens the minicart slider and waits for it to be visible
 */
function openMiniCart() {
    cy.get(selectors.miniCartButton).click()
    cy.get(selectors.miniCartSlider).should('be.visible')
}

/**
 * Adds a product to the cart from its PDP
 */
function addProductToCart(productUrl) {
    cy.visit(productUrl)
    cy.get(selectors.addToCartButton).click()
}

describe('Mini cart tests', () => {
    beforeEach(() => {
        addProductToCart(minicart.didiSportWatch)
        openMiniCart()
    })

    it('Can open minicart slider', () => {
        cy.get(selectors.miniCartSlider).should('be.visible')
    })

    it('Can delete an item from the cart slider', () => {
        cy.get(selectors.removeProductButton).click()
        cy.contains('You removed the item.')
    })

    it('Can navigate to the product when clicking the edit icon', () => {
        cy.get(selectors.miniCartProductName)
            .invoke('text')
            .then((minicartProductName) => {
                cy.get(selectors.miniCartEditProductButton).click()
                cy.get(selectors.PDPProductName)
                    .invoke('text')
                    .should((pdpProductName) => {
                        expect(pdpProductName.trim()).to.equal(minicartProductName.trim())
                    })
            })
    })

    it('Can navigate to the cart with a link in the slider', () => {
        cy.get(selectors.miniCartViewCartLink).click()
        cy.get(selectors.pageTitle)
            .should('be.visible')
            .and('contain.text', 'Shopping Cart')
    })

    it('Can navigate to the checkout with a link in the slider', () => {
        cy.get(selectors.miniCartCheckoutButton).click()
        cy.title().should('eq', 'Checkout')
    })

    it('Can change quantity in the minicart', () => {
        const newQuantity = 2

        cy.get(selectors.miniCartSlider).within(() => {
            cy.get(selectors.miniCartEditProductButton).click()
        })

        cy.get(selectors.qtyInputField).clear()
        cy.get(selectors.qtyInputField).type(`${newQuantity}{enter}`)
        cy.get(selectors.qtyInputField).should('have.value', String(newQuantity))

        cy.get(selectors.addToCartButton).click()
        openMiniCart()

        cy.get(selectors.productQty).should('have.text', String(newQuantity))
    })
})

describe('Mini cart price verification', () => {
    it('displays correct prices matching the product page', () => {
        let pdpPrice

        cy.visit(minicart.waterBottle)

        cy.get(selectors.productPrice)
            .invoke('text')
            .then((priceText) => {
                pdpPrice = parsePrice(priceText)
            })

        cy.get(selectors.addToCartButton).click()
        openMiniCart()

        cy.get(selectors.miniCartProductPrice)
            .first()
            .invoke('text')
            .should((minicartPriceText) => {
                const minicartPrice = parsePrice(minicartPriceText)
                expect(minicartPrice).to.equal(pdpPrice)
            })
    })

    it('calculates subtotal correctly based on quantity and price', () => {
        addProductToCart(minicart.waterBottle)
        openMiniCart()

        cy.get(selectors.miniCartProductPrice).first().invoke('text').as('priceText')
        cy.get(selectors.firstProductAmount).invoke('text').as('qtyText')
        cy.get(selectors.miniCartSubtotal).invoke('text').as('subtotalText')

        cy.then(function () {
            const unitPrice = parsePrice(this.priceText)
            const quantity = parseInt(this.qtyText.trim(), 10)
            const subtotal = parsePrice(this.subtotalText)
            const expectedSubtotal = unitPrice * quantity

            expect(subtotal).to.equal(expectedSubtotal)
        })
    })
})
