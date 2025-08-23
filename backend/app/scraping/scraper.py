import time
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.chrome.service import Service


def select_domain(driver, domaines: list[str]):
    if not domaines:
        return

    wait = WebDriverWait(driver, 15)

    # Masquer l'overlay si présent
    try:
        driver.execute_script("""
            const el = document.querySelector('#contentFicheConseil');
            if (el) el.style.display = 'none';
        """)
    except Exception as e:
        print(f"⚠️ Erreur masquage overlay : {e}")

    # Ouvrir la popup
    try:
        btn = wait.until(EC.element_to_be_clickable(
            (By.ID, "ctl0_CONTENU_PAGE_AdvancedSearch_domaineActivite_linkDisplay")
        ))
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", btn)
        btn.click()
    except Exception as e:
        print(f"⚠️ Erreur clic domaine : {e}")
        return

    # Switch vers popup
    main_handle = driver.current_window_handle
    WebDriverWait(driver, 10).until(lambda d: len(d.window_handles) > 1)
    popup_handle = [h for h in driver.window_handles if h != main_handle][0]
    driver.switch_to.window(popup_handle)

    # Déplier toutes les catégories
    driver.execute_script("""
        document.querySelectorAll('ul.indent-ss-cat, ul.indent-cat').forEach(u => u.style.display = 'block');
        document.querySelectorAll('img[id^="sous-cats_img_plus_moins_"]').forEach(i => {
            if (i.src.includes('picto-plus.gif')) {
                i.src = i.src.replace('picto-plus.gif', 'picto-moins.gif');
            }
        });
    """)
    time.sleep(0.3)

    # Sélectionner chaque domaine
    labels = driver.find_elements(By.TAG_NAME, "label")
    for domaine in domaines:
        print(f"🔍 Sélection du domaine d'activité: '{domaine}'")
        target_label = None
        for lbl in labels:
            try:
                if domaine in lbl.text:
                    target_label = lbl
                    break
            except:
                continue

        if not target_label:
            print(f"⚠️ Domaine '{domaine}' introuvable. Ignoré.")
            continue

        # Cocher la case
        try:
            checkbox = target_label.find_element(By.XPATH, "./preceding::input[@type='checkbox'][1]")
            if not checkbox.is_selected():
                checkbox.click()
        except Exception as e:
            print(f"⚠️ Impossible de cocher la checkbox pour '{domaine}': {e}")

    # Valider la popup
    try:
        WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.ID, "ctl0_CONTENU_PAGE_validateButton"))
        ).click()
    except Exception as e:
        print(f"⚠️ Échec clic sur Valider : {e}")

    # Retour à la fenêtre principale
    WebDriverWait(driver, 5).until(lambda d: len(d.window_handles) == 1)
    driver.switch_to.window(main_handle)
    time.sleep(0.5)


def fill_acheteur_public(driver, acheteur: str):
    if not acheteur:
        return
    wait = WebDriverWait(driver, 10)
    print(f"🔍 Remplissage acheteur public: '{acheteur}'")
    inp = wait.until(EC.visibility_of_element_located(
        (By.ID, "ctl0_CONTENU_PAGE_AdvancedSearch_orgName")))
    inp.clear()
    inp.send_keys(acheteur)
    time.sleep(0.5)
    inp.send_keys(Keys.TAB)
    time.sleep(0.2)


def fill_reference(driver, reference: str):
    if not reference:
        return
    wait = WebDriverWait(driver, 10)
    print(f"🔍 Remplissage référence: '{reference}'")
    try:
        ref_input = wait.until(EC.visibility_of_element_located(
            (By.ID, "ctl0_CONTENU_PAGE_AdvancedSearch_reference")
        ))
    except Exception as e:
        print(f"⚠️ champ Référence introuvable: {e}")
        return

    try:
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", ref_input)
    except:
        pass

    try:
        ref_input.clear()
        ref_input.send_keys(reference)
        driver.execute_script("arguments[0].dispatchEvent(new Event('input')); arguments[0].blur();", ref_input)
        time.sleep(0.2)
    except Exception:
        try:
            driver.execute_script(
                "arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('input'));",
                ref_input, reference
            )
            driver.execute_script("arguments[0].blur();", ref_input)
            time.sleep(0.2)
        except Exception as e2:
            print(f"⚠️ impossible de forcer la référence par JS: {e2}")


def launch_search(driver):
    print("🔎 Lancement de la recherche")
    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.ID, "ctl0_CONTENU_PAGE_AdvancedSearch_lancerRecherche"))
    ).click()


def wait_for_results_page(driver, timeout=30):
    """Attend que la page de résultats se charge complètement avec stratégies multiples"""
    wait = WebDriverWait(driver, timeout)
    try:
        # Stratégie 1: Attendre les éléments normaux avec le bon ID
        wait.until(EC.any_of(
            EC.presence_of_element_located((By.CSS_SELECTOR, "table.table-results tbody tr:not(.dataTables_empty) span.ref")),
            EC.presence_of_element_located((By.CSS_SELECTOR, ".dataTables_empty")),
            EC.presence_of_element_located((By.ID, "ctl0_CONTENU_PAGE_resultSearch_nombreElement"))
        ))
        time.sleep(1)
        return True
    except TimeoutException:
        print("⚠️ Timeout stratégie 1, tentative stratégie alternative...")
        
    try:
        # Stratégie 2: Attendre tout élément indiquant des résultats
        wait.until(EC.any_of(
            EC.presence_of_element_located((By.CSS_SELECTOR, "table.table-results")),
            EC.presence_of_element_located((By.CSS_SELECTOR, "[class*='result']")),
            EC.presence_of_element_located((By.CSS_SELECTOR, "[id*='result']"))
        ))
        time.sleep(2)
        return True
    except TimeoutException:
        print("⚠️ Timeout stratégie 2")
        
    try:
        # Stratégie 3: Vérifier si la page a changé (URL contient 'result' ou similaire)
        current_url = driver.current_url.lower()
        if 'result' in current_url or 'search' in current_url:
            time.sleep(2)
            return True
    except Exception as e:
        print(f"⚠️ Erreur vérification URL: {e}")
    
    print("⚠️ Timeout lors de l'attente de la page de résultats")
    return False


def get_total_results(driver):
    """Récupère le nombre total de résultats avec plusieurs stratégies de fallback"""
    try:
        # Stratégie 1: Utiliser l'ID correct basé sur votre HTML
        total_element = driver.find_element(By.ID, "ctl0_CONTENU_PAGE_resultSearch_nombreElement")
        total = int(total_element.text.strip())
        print(f"📊 Total des résultats: {total}")
        return total
    except Exception as e:
        print(f"⚠️ Stratégie 1 échouée: {e}")
        
    try:
        # Stratégie 2: Chercher par span avec le bon ID
        total_span = driver.find_element(By.CSS_SELECTOR, "span[id='ctl0_CONTENU_PAGE_resultSearch_nombreElement']")
        total = int(total_span.text.strip())
        print(f"📊 Total des résultats (stratégie 2): {total}")
        return total
    except Exception as e:
        print(f"⚠️ Stratégie 2 échouée: {e}")
        
    try:
        # Stratégie 3: Chercher dans les éléments contenant du texte numérique
        elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'résultat') or contains(text(), 'result')]")
        for elem in elements:
            text = elem.text.strip()
            # Chercher un pattern comme "X résultats" ou "Total: X"
            import re
            numbers = re.findall(r'\d+', text)
            if numbers:
                total = int(numbers[0])
                print(f"📊 Total des résultats (stratégie 3): {total}")
                return total
    except Exception as e:
        print(f"⚠️ Stratégie 3 échouée: {e}")
        
    try:
        # Stratégie 4: Compter les lignes de résultats visibles et extrapoler
        visible_rows = driver.find_elements(
            By.CSS_SELECTOR,
            "table.table-results tbody tr:not(.dataTables_empty)"
        )
        if visible_rows:
            # Si on a des résultats visibles, on assume qu'il y en a au moins autant
            total = len(visible_rows)
            print(f"📊 Total estimé basé sur les lignes visibles: {total}")
            return total
    except Exception as e:
        print(f"⚠️ Stratégie 4 échouée: {e}")
    
    print("⚠️ Impossible de déterminer le nombre total de résultats")
    return 0


def set_max_results_per_page(driver):
    """Met le sélecteur sur 500 résultats par page pour récupérer le maximum"""
    try:
        # ID corrigé : un seul zéro après ctl
        select_element = driver.find_element(By.ID, "ctl0_CONTENU_PAGE_resultSearch_listePageSizeTop")
        select = Select(select_element)
        select.select_by_value("500")
        print("📄 Configuration: 500 résultats par page")
        
        # Attendre le rechargement de la page
        time.sleep(3)
        return True
    except Exception as e:
        print(f"⚠️ Erreur configuration 500 résultats par page : {e}")
        return False


def fetch_marches_from_current_page(driver):
    """Récupère les marchés de la page actuellement affichée"""
    marches = []
    
    try:
        rows = driver.find_elements(
            By.CSS_SELECTOR,
            "table.table-results tbody tr:not(.dataTables_empty)"
        )
        
        print(f"📄 {len(rows)} marchés trouvés sur cette page")
        
        for tr in rows:
            try:
                reference = tr.find_element(By.CSS_SELECTOR, "span.ref").text.strip()
                objet = tr.find_element(
                    By.CSS_SELECTOR,
                    "div[id$='_panelBlocObjet']"
                ).text.replace("Objet : ", "").strip()
                acheteur = tr.find_element(
                    By.CSS_SELECTOR,
                    "div[id$='_panelBlocDenomination']"
                ).text.replace("Acheteur public : ", "").strip()
                raw_lieu = tr.find_element(
                    By.CSS_SELECTOR,
                    "div[id$='_panelBlocLieuxExec']"
                ).text
                lieu_execution = raw_lieu.splitlines()[0].strip()
                raw_dt = tr.find_element(
                    By.CSS_SELECTOR,
                    "td[headers='cons_dateEnd'] .cloture-line"
                ).text
                date_str, time_str = raw_dt.split()
                date_limite_remise = datetime.strptime(
                    f"{date_str} {time_str}", "%d/%m/%Y %H:%M"
                )

                try:
                    lien_elem = tr.find_element(
                        By.CSS_SELECTOR,
                        "div[id$='_panelAction'] a[target]"
                    )
                    lien_consultation = lien_elem.get_attribute("href")
                except Exception:
                    lien_consultation = ""

                marches.append({
                    "reference": reference,
                    "objet": objet,
                    "acheteur_public": acheteur,
                    "lieu_execution": lieu_execution,
                    "date_limite_remise": date_limite_remise,
                    "lien_consultation": lien_consultation,
                })

            except Exception as e:
                print(f"⚠️ Échec parsing d'une ligne de résultat : {e}")
                continue
    
    except Exception as e:
        print(f"⚠️ Erreur lors de la récupération des marchés de la page : {e}")
    
    return marches


def has_next_page(driver):
    """Vérifie s'il y a une page suivante disponible"""
    try:
        # Chercher les liens de pagination
        pagination_links = driver.find_elements(By.CSS_SELECTOR, "a[href*='Page']")
        
        for link in pagination_links:
            link_text = link.text.strip().lower()
            if 'suivant' in link_text or 'next' in link_text or '>' in link_text:
                # Vérifier si le lien est cliquable (pas désactivé)
                if link.is_enabled() and 'disabled' not in link.get_attribute('class'):
                    return True
        
        # Alternative: chercher les numéros de page
        current_page_found = False
        for link in pagination_links:
            if 'selected' in link.get_attribute('class') or 'current' in link.get_attribute('class'):
                current_page_found = True
                continue
            if current_page_found and link.text.strip().isdigit():
                return True
        
        return False
    except Exception as e:
        print(f"⚠️ Erreur vérification page suivante : {e}")
        return False


def go_to_next_page(driver):
    """Navigue vers la page suivante"""
    try:
        # Chercher le bouton "Suivant" ou ">"
        next_buttons = driver.find_elements(By.CSS_SELECTOR, 
            "a[title*='Suivant'], a[title*='suivant'], a[title*='Next'], a[title*='next']")
        
        for button in next_buttons:
            if button.is_enabled() and button.is_displayed() and 'disabled' not in button.get_attribute('class'):
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", button)
                button.click()
                time.sleep(3)  # Attendre le chargement
                return True
        
        # Alternative: chercher les liens de pagination numérotés
        page_links = driver.find_elements(By.CSS_SELECTOR, "a[href*='Page']")
        current_page_found = False
        
        for link in page_links:
            if 'selected' in link.get_attribute('class') or 'current' in link.get_attribute('class'):
                current_page_found = True
                continue
            
            if current_page_found and link.text.strip().isdigit():
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", link)
                link.click()
                time.sleep(3)
                return True
        
        print("⚠️ Bouton 'Suivant' non trouvé")
        return False
        
    except Exception as e:
        print(f"⚠️ Erreur navigation page suivante : {e}")
        return False


def debug_page_elements(driver):
    """Fonction de debug pour identifier les éléments disponibles sur la page"""
    print("\n🔍 === DEBUG: ÉLÉMENTS DE LA PAGE ===")
    
    # 1. Vérifier l'URL actuelle
    print(f"URL actuelle: {driver.current_url}")
    
    # 2. Chercher tous les éléments avec 'result' ou 'nombre' dans l'ID
    try:
        elements_by_id = driver.find_elements(By.XPATH, "//*[contains(@id, 'result') or contains(@id, 'nombre') or contains(@id, 'total')]")
        print(f"Éléments avec IDs contenant 'result/nombre/total': {len(elements_by_id)}")
        for elem in elements_by_id[:5]:  # Limiter à 5 éléments
            try:
                print(f"  - ID: {elem.get_attribute('id')}, Text: {elem.text[:50]}...")
            except:
                print(f"  - ID: {elem.get_attribute('id')}, Text: [illisible]")
    except Exception as e:
        print(f"Erreur recherche par ID: {e}")
    
    # 3. Chercher la table de résultats
    try:
        tables = driver.find_elements(By.CSS_SELECTOR, "table")
        print(f"Tables trouvées: {len(tables)}")
        for i, table in enumerate(tables[:3]):
            try:
                class_name = table.get_attribute('class')
                print(f"  - Table {i}: class='{class_name}'")
            except:
                print(f"  - Table {i}: [attributs illisibles]")
    except Exception as e:
        print(f"Erreur recherche tables: {e}")
    
    # 4. Chercher les éléments de pagination
    try:
        pagination_elements = driver.find_elements(By.XPATH, "//*[contains(@class, 'page') or contains(@id, 'page') or contains(text(), 'page')]")
        print(f"Éléments de pagination: {len(pagination_elements)}")
    except Exception as e:
        print(f"Erreur recherche pagination: {e}")
    
    print("🔍 === FIN DEBUG ===\n")


def fetch_all_marches(driver, timeout=60):
    """
    Version améliorée avec debug et gestion d'erreurs renforcée
    """
    print("🚀 Début de fetch_all_marches")
    
    if not wait_for_results_page(driver, timeout):
        print("❌ Échec de l'attente de la page de résultats")
        debug_page_elements(driver)  # Debug en cas d'échec
        return []

    # Debug pour comprendre la structure de la page
    debug_page_elements(driver)

    # Vérifier s'il y a des résultats
    try:
        empty_elements = driver.find_elements(By.CSS_SELECTOR, ".dataTables_empty")
        if empty_elements and any(elem.is_displayed() for elem in empty_elements):
            print("ℹ️ Aucun marché trouvé (élément dataTables_empty visible)")
            return []
    except Exception as e:
        print(f"⚠️ Erreur vérification éléments vides: {e}")

    # Récupérer le nombre total de résultats
    total_results = get_total_results(driver)
    if total_results == 0:
        print("ℹ️ Aucun résultat trouvé selon get_total_results")
        # Mais on continue quand même pour essayer de récupérer ce qu'on peut
        print("🔄 Tentative de récupération malgré tout...")

    # Mettre le sélecteur sur 500 résultats par page
    if not set_max_results_per_page(driver):
        print("⚠️ Impossible de configurer 500 résultats par page, utilisation des paramètres par défaut")

    # Attendre que la page se recharge
    if not wait_for_results_page(driver, timeout):
        print("⚠️ Erreur lors du rechargement avec 500 résultats")
        # Continue quand même

    all_marches = []
    page_num = 1
    
    print(f"🚀 Début de la récupération complète")
    
    while True:
        print(f"📄 Récupération page {page_num}...")
        
        # Récupérer les marchés de la page actuelle
        page_marches = fetch_marches_from_current_page(driver)
        if not page_marches:
            print("⚠️ Aucun marché récupéré sur cette page")
            if page_num == 1:
                # Si même la première page ne donne rien, debug
                debug_page_elements(driver)
            break
            
        all_marches.extend(page_marches)
        print(f"✅ Page {page_num}: {len(page_marches)} marchés récupérés (Total: {len(all_marches)})")
        
        # Vérifier s'il y a une page suivante
        if not has_next_page(driver):
            print("✅ Toutes les pages ont été récupérées")
            break
            
        # Aller à la page suivante
        if not go_to_next_page(driver):
            print("⚠️ Impossible d'aller à la page suivante, arrêt")
            break
            
        page_num += 1
        
        # Sécurité: éviter une boucle infinie
        if page_num > 100:
            print("⚠️ Limite de pages atteinte (100 pages)")
            break
    
    print(f"🎉 Récupération terminée: {len(all_marches)} marchés au total")
    return all_marches


def fetch_marches_direct(driver, timeout=30):
    """Version originale pour compatibilité - récupère seulement la première page"""
    if not wait_for_results_page(driver, timeout):
        return []
    
    return fetch_marches_from_current_page(driver)


def init_driver(headless=False):
    opts = Options()
    if headless:
        opts.add_argument("--headless=new")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.binary_location = "/usr/bin/chromium"

    service = Service("/usr/bin/chromedriver")
    return webdriver.Chrome(service=service, options=opts)