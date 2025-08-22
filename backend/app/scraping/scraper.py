import time
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.chrome.service import Service

def select_domain(driver, domaines: list[str]):
    if not domaines:
        return

    wait = WebDriverWait(driver, 15)
    try:
        driver.execute_script("""
            const el = document.querySelector('#contentFicheConseil');
            if (el) el.style.display = 'none';
        """)
    except Exception as e:
        print(f"Erreur masquage overlay : {e}")

    try:
        btn = wait.until(EC.element_to_be_clickable(
            (By.ID, "ctl0_CONTENU_PAGE_AdvancedSearch_domaineActivite_linkDisplay")
        ))
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", btn)
        btn.click()
    except Exception as e:
        print(f"Erreur clic domaine : {e}")
        return

    main_handle = driver.current_window_handle
    WebDriverWait(driver, 10).until(lambda d: len(d.window_handles) > 1)
    popup_handle = [h for h in driver.window_handles if h != main_handle][0]
    driver.switch_to.window(popup_handle)

    driver.execute_script("""
        document.querySelectorAll('ul.indent-ss-cat, ul.indent-cat').forEach(u => u.style.display = 'block');
        document.querySelectorAll('img[id^="sous-cats_img_plus_moins_"]').forEach(i => {
            if (i.src.includes('picto-plus.gif')) {
                i.src = i.src.replace('picto-plus.gif', 'picto-moins.gif');
            }
        });
    """)
    time.sleep(0.3)

    labels = driver.find_elements(By.TAG_NAME, "label")
    for domaine in domaines:
        print(f"Selection du domaine d'activité: '{domaine}'")
        target_label = None
        for lbl in labels:
            try:
                if domaine in lbl.text:
                    target_label = lbl
                    break
            except:
                continue

        if not target_label:
            print(f"Domaine '{domaine}' introuvable. Ignore.")
            continue

        try:
            checkbox = target_label.find_element(By.XPATH, "./preceding::input[@type='checkbox'][1]")
            if not checkbox.is_selected():
                checkbox.click()
        except Exception as e:
            print(f"Impossible de cocher la checkbox pour '{domaine}': {e}")

    try:
        WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.ID, "ctl0_CONTENU_PAGE_validateButton"))
        ).click()
    except Exception as e:
        print(f"Echec clic sur Valider : {e}")

    WebDriverWait(driver, 5).until(lambda d: len(d.window_handles) == 1)
    driver.switch_to.window(main_handle)
    time.sleep(0.5)

def fill_acheteur_public(driver, acheteur: str):
    if not acheteur:
        return
    wait = WebDriverWait(driver, 10)
    print(f"Remplissage acheteur public: '{acheteur}'")
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
    print(f"Remplissage référence: '{reference}'")
    try:
        ref_input = wait.until(EC.visibility_of_element_located(
            (By.ID, "ctl0_CONTENU_PAGE_AdvancedSearch_reference")
        ))
    except Exception as e:
        print(f"champ Référence introuvable: {e}")
        return

    try:
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", ref_input)
    except:
        pass

    try:
        ref_input.clear()
    except:
        pass
    try:
        ref_input.send_keys(reference)
        driver.execute_script("arguments[0].dispatchEvent(new Event('input')); arguments[0].blur();", ref_input)
        time.sleep(0.2)
    except Exception:
        try:
            driver.execute_script(
                "arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('input'));",
                ref_input,
                reference,
            )
            driver.execute_script("arguments[0].blur();", ref_input)
            time.sleep(0.2)
        except Exception as e2:
            print(f"impossible de forcer la référence par JS: {e2}")

def launch_search(driver):
    print("Lancement de la recherche")
    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.ID, "ctl0_CONTENU_PAGE_AdvancedSearch_lancerRecherche"))
    ).click()

def fetch_marches_direct(driver, timeout=30):
    wait = WebDriverWait(driver, timeout)
    try:
        wait.until(EC.presence_of_element_located((
            By.CSS_SELECTOR,
            "table.table-results tbody tr:not(.dataTables_empty) span.ref"
        )))
    except TimeoutException:
        print("Aucun marché trouvé ou délai dépassé lors de l'attente des résultats.")
        return []

    marches = []
    rows = driver.find_elements(
        By.CSS_SELECTOR,
        "table.table-results tbody tr:not(.dataTables_empty)"
    )
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
            except Exception as e:
                print(f"Lien 'Accéder à la consultation' introuvable: {e}")
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
            print(f"Echec parsing d'une ligne de résultat : {e}")
            continue

    return marches

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
