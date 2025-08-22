from scraping.scraper import (
    init_driver,
    select_domain,
    fill_reference,
    fill_acheteur_public,
    launch_search,
    fetch_marches_direct
)

class MarcheService:
    async def chercher_marches(self, domaines: list[str] = [], reference: str = "", acheteur: str = ""):
        driver = init_driver(headless=True)
        try:
            driver.get("https://www.marchespublics.gov.ma/index.php?page=entreprise.EntrepriseAdvancedSearch&searchAnnCons=")
            select_domain(driver, domaines)
            if reference:
                fill_reference(driver, reference)
            if acheteur:
                fill_acheteur_public(driver, acheteur)

            launch_search(driver)
            resultats = fetch_marches_direct(driver)
            return resultats
        finally:
            driver.quit()

