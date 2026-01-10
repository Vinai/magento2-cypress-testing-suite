import cart from "../../../fixtures/hyva/selectors/cart.json";
import account from "../../../fixtures/account.json";
import { Cart } from "../../../page-objects/hyva/cart";
import { Account } from "../../../page-objects/hyva/account";
import {isMobileHyva} from "../../../support/utils";

describe("Isolated test for adding a product to the cart", () => {
    it("Can add a product to the cart", () => {
        Cart.addProductToCart(cart.url.product1Url);
        cy.get(cart.product.messageToast)
            .should("include.text", "to your shopping cart")
            .should("be.visible");
    });
});

describe("Cart tests", () => {
    beforeEach(() => {
        Cart.addProductToCart(cart.url.product1Url);
        cy.visit(cart.url.cartUrl);
        cy.get(cart.pageTitle).should("contain.text", "Shopping Cart")
    });

    it("Can change the quantity in the cart", () => {
        cy.get(cart.qtyInputField)
            .type("{backspace}2{enter}")
            .should("have.value", "2");
    });

    it("Can remove a product from the cart", () => {
        cy.get(cart.deleteProductButton).click();
        cy.get(cart.emptyCartTextField)
            .should("include.text", "You have no items in your shopping cart.")
            .should("be.visible");
    });

    it("Can add a coupon to the cart", () => {
        Cart.addProductToCart(cart.url.product2Url);
        Cart.addCouponCode(cart.couponCode);
        cy.get(cart.successMessages).should("contain.text", `You used coupon code "${cart.couponCode}"`)
        cy.get(cart.couponInputField).invoke('attr', 'value').should('eq', cart.couponCode)
        cy.get(cart.cartSummaryTable).should("include.text", "Discount")
        cy.get(cart.cartTotalLabels).contains("Discount").should("include.text", "Discount")
    });

    it("Can delete an added coupon from the cart", () => {
        Cart.addProductToCart(cart.url.product2Url);
        Cart.addCouponCode(cart.couponCode);
        cy.get(cart.cartSummaryTable).should("include.text", "Discount")
        Cart.removeCoupon();
        cy.get(cart.successMessages).should("contain.text", `You canceled the coupon code.`)
        cy.get(cart.cartSummaryTable).should("not.include.text", "Discount")
    });

    it("Cannot add an invalid coupon", () => {
        cy.get(cart.couponDropdownSelector).click();
        cy.get(cart.couponInputField).type("wrong coupon code");
        cy.get(cart.addCouponButton).click();
        cy.get(cart.messageToast)
            .should(
                "include.text",
                `The coupon code "wrong coupon code" is not valid.`
            )
            if (!isMobileHyva()) {
                cy.get(cart.messageToast)
                    .should("be.visible");
            }
    });

    it("Displays the correct product prices and totals", () => {
        /**
         * Parses a price string like "$92.00" and returns the numeric value (92).
         */
        const parsePrice = (priceString) => {
            return parseInt(priceString.replace(/[^0-9.]/g, ''), 10);
        };

        /**
         * Waits for the cart totals to finish updating (spinner disappears).
         */
        const waitForCartUpdate = () => {
            cy.get('#cart-totals svg.animate-spin').should('exist');
            cy.get('#cart-totals svg.animate-spin').should('not.exist');
        };

        // Step 1: Get product 1's unit price from the PDP
        cy.visit(cart.url.product1Url);
        cy.get(cart.product.productPrice)
            .first()
            .invoke('text')
            .then(text => text.trim())
            .as('product1UnitPrice');

        // Step 2: Add product 2 to cart (product 1 was already added in beforeEach)
        Cart.addProductToCart(cart.url.product2Url);
        cy.get(cart.product.messageToast).should("include.text", "to your shopping cart");

        // Step 3: Go to cart and verify product 1's price is displayed correctly
        cy.visit(cart.url.cartUrl);
        cy.get(cart.pageTitle).should("contain.text", "Shopping Cart");
        cy.get('@product1UnitPrice').then((expectedPrice) => {
            cy.get(cart.productPrice).first().should("have.text", expectedPrice);
        });

        // Step 4: Select a country without tax rules to simplify price calculations
        cy.get('#block-shipping').click();
        cy.get('#shipping-zip-form select[name="country_id"]').select('Aruba');
        waitForCartUpdate();

        // Step 5: Change product 1 quantity to 2 and verify line subtotal
        const newQuantity = 2;
        cy.get(cart.qtyInputField).first().clear();
        cy.get(cart.qtyInputField).first().type(`${newQuantity}{enter}`);
        waitForCartUpdate();

        cy.get('@product1UnitPrice').then((unitPriceText) => {
            const unitPrice = parsePrice(unitPriceText);
            const expectedSubtotal = unitPrice * newQuantity;

            cy.get(cart.productSubtotal)
                .first()
                .invoke('text')
                .then(parsePrice)
                .should('equal', expectedSubtotal);
        });

        // Step 6: Verify grand total equals sum of all product subtotals
        cy.get(cart.productSubtotal).then(($subtotals) => {
            const subtotalSum = Array.from($subtotals)
                .map(el => parsePrice(el.textContent))
                .reduce((sum, val) => sum + val, 0);

            cy.get(cart.grandTotal)
                .invoke('text')
                .then(parsePrice)
                .should('equal', subtotalSum);
        });
    });
});
