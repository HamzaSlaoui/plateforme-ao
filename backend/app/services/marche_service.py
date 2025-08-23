from scraping.scraper import (
    init_driver,
    select_domain,
    fill_reference,
    fill_acheteur_public,
    launch_search,
    fetch_all_marches,
    fetch_marches_direct
)

class MarcheService:
    async def chercher_marches_complet(
        self, 
        domaines: list[str] = [], 
        reference: str = "", 
        acheteur: str = ""
    ):
        """
        Cherche et récupère TOUS les marchés correspondant aux critères
        
        Args:
            domaines: Liste des domaines d'activité
            reference: Référence du marché
            acheteur: Nom de l'acheteur public
        
        Returns:
            list: Liste complète de tous les marchés
        """
        driver = init_driver(headless=True)
        try:
            driver.get("https://www.marchespublics.gov.ma/index.php?page=entreprise.EntrepriseAdvancedSearch&searchAnnCons=")
            
            # Configurer les critères de recherche
            select_domain(driver, domaines)
            if reference:
                fill_reference(driver, reference)
            if acheteur:
                fill_acheteur_public(driver, acheteur)

            # Lancer la recherche
            launch_search(driver)
            
            # Récupérer TOUS les résultats
            resultats = fetch_all_marches(driver)
            
            return resultats
            
        finally:
            driver.quit()
    
    async def chercher_marches_simple(
        self, 
        domaines: list[str] = [], 
        reference: str = "", 
        acheteur: str = ""
    ):
        """Version simple qui retourne seulement la première page (pour compatibilité)"""
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