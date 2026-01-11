import product from "../../../fixtures/hyva/product.json";
import selectors from "../../../fixtures/hyva/selectors/category.json";

describe("Category page tests", () => {
    beforeEach(() => {
        cy.visit(product.categoryUrl);
    });

    it("Can filter products by color", () => {
        cy.get(selectors.shopByColorFilter).contains("Color").click()
        cy.get(selectors.selectColorRed).click()

        cy.get(selectors.activeFilterLabel).should("contain.text", "Color")
        cy.get(selectors.activeFilterValue).should("contain.text", "Red")
    });

    it("Can sort products by price (low to high)", () => {
        cy.get(selectors.sortBySelect).first().select(product.selectByPrice)

        // Store prices using aliases for cleaner comparison
        cy.get(selectors.productPriceDataAtt).eq(0).invoke("data", "price-amount").as("firstPrice")
        cy.get(selectors.productPriceDataAtt).eq(1).invoke("data", "price-amount").as("secondPrice")

        cy.get("@firstPrice").then((firstPrice) => {
            cy.get("@secondPrice").should("be.greaterThan", firstPrice)
        })
    });

    it("Can change the number of products displayed", () => {
        cy.get(selectors.highestNumberOfProductsShowOption)
            .invoke("val")
            .then((maxProducts) => {
                cy.get(selectors.numberOfProductsSelect).first().select(maxProducts)

                cy.get(selectors.numberOfShownItems)
                    .first()
                    .should("have.text", maxProducts)

                cy.get(selectors.categoryProductContainer)
                    .should("have.length.at.most", parseInt(maxProducts, 10))
            })
    });

    it("Can see the correct breadcrumbs", () => {
        cy.get(selectors.breadcrumbsItem).eq(0).should("contain.text", "Home")
        cy.get(selectors.breadcrumbsItem).eq(1).should("contain.text", product.category)
        cy.get(selectors.breadcrumbsItem).eq(2).should("contain.text", product.subCategory)
    });

    it("Can switch between grid and list view", () => {
        cy.get(selectors.categoryProductGridWrapper).should("be.visible")

        cy.get(selectors.listModeButton).first().click()

        cy.get(selectors.categoryProductListWrapper).should("be.visible")
    });

    it("Can navigate to the next page using pagination", function () {
        // Skip test if pagination doesn't exist (not enough products)
        cy.get("body").then(($body) => {
            if (!$body.find(selectors.pageNavigation).length) {
                this.skip()
            }
        })

        cy.get(selectors.pageNavigation).should("have.length.at.least", 6)
        cy.get(selectors.pageLink).contains("2").click()

        cy.url().should("include", "p=2")
        cy.get(selectors.currentPageItem)
            .should("contain.text", "2")
            .and("have.attr", "aria-current", "page")
    });
});
