import product from "../../../fixtures/hyva/product.json";
import selectors from "../../../fixtures/hyva/selectors/category.json";

describe("Category page tests", () => {
    beforeEach(() => {
        cy.visit(product.categoryUrl);
    });

    it("Can filter products by color", () => {
        // Open color filter and select red
        cy.get(selectors.shopByColorFilter).contains('Color').click();
        cy.get(selectors.selectColorRed).click();

        // Verify active filter shows Color: Red
        cy.get(selectors.activeFilterLabel).should("contain.text", "Color");
        cy.get(selectors.activeFilterValue).should("contain.text", "Red");
    });

    it("Can sort products by price from lowest to highest", () => {
        // Select "Price" sort option
        cy.get(selectors.sortBySelect).first().select(product.selectByPrice);

        // Capture prices of first two products
        cy.get(selectors.productPriceDataAtt).eq(0).invoke("data", "price-amount").as("firstPrice");
        cy.get(selectors.productPriceDataAtt).eq(1).invoke("data", "price-amount").as("secondPrice");

        // Verify first product is cheaper than second
        cy.get("@firstPrice").then((firstPrice) => {
            cy.get("@secondPrice").should("be.greaterThan", firstPrice);
        });
    });

    it("Can change the number of products displayed", () => {
        // Get the highest available option value for products per page
        cy.get(selectors.highestNumberOfProductsShowOption).invoke("val").as("maxProducts");

        cy.get("@maxProducts").then((maxProducts) => {
            // Select the maximum products per page option
            cy.get(selectors.numberOfProductsSelect).first().select(maxProducts);

            // Verify toolbar shows the selected count
            cy.get(selectors.numberOfShownItems).first().should("have.text", maxProducts);

            // Verify product count doesn't exceed the selected limit
            cy.get(selectors.categoryProductContainer)
                .children()
                .should("have.length.at.most", parseInt(maxProducts, 10));
        });
    });

    it("Can see the correct breadcrumbs", () => {
        cy.get(selectors.breadcrumbsItem).eq(0).should("contain.text", "Home");
        cy.get(selectors.breadcrumbsItem).eq(1).should("contain.text", product.category);
        cy.get(selectors.breadcrumbsItem).eq(2).should("contain.text", product.subCategory);
    });

    it("Can switch between grid and list view", () => {
        // Verify grid view is shown by default
        cy.get(selectors.categoryProductGridWrapper).should("be.visible");

        // Switch to list view and verify
        cy.get(selectors.listModeButton).first().click();
        cy.get(selectors.categoryProductListWrapper).should("be.visible");
    });

    it("Can navigate to the next page using pagination", () => {
        // Check if pagination exists on this category
        cy.get("body").then(($body) => {
            if ($body.find(selectors.pageNavigation).length === 0) {
                // No pagination - skip test gracefully
                cy.log("No pagination available on this category page");
                return;
            }

            // Verify pagination has reasonable number of items
            cy.get(selectors.pageNavigation).should("have.length.at.most", 6);

            // Click on page 2
            cy.get(selectors.pageLink).contains("2").click();

            // Verify URL contains page parameter
            cy.url().should("include", "p=2");

            // Verify page 2 is now the active (non-linked) page
            cy.get(selectors.secondPageItem)
                .first()
                .should("include.text", "2")
                .should("not.have.attr", "href");
        });
    });
});
