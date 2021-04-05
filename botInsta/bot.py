from time import sleep
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import urllib
import urllib.request


class InstaBot:
    pseudo = 'pseudo'

    message = "Hello " + pseudo + " ! I am Zengalewa, Naggs' bot. What is your favorite country ?"
    tab = []
    message2 = ""
    leMessage = ""

    def __init__(self, user, passwd):
        self.driver2 = webdriver.Firefox()
        self.driver = webdriver.Firefox()
        self.username = user

        wait = WebDriverWait(self.driver, 20)

        self.driver.get("https://www.instagram.com/")

        wait.until(EC.presence_of_element_located((By.NAME, "username")))

        username = self.driver.find_element_by_name("username")
        username.send_keys(user)
        password = self.driver.find_element_by_name("password")

        password.send_keys(passwd)
        self.driver.find_element_by_xpath("//div[contains(text(), 'Connexion')]").click()

        wait.until(EC.presence_of_element_located((By.XPATH, "//button[contains(text(), 'Plus tard')]")))

        self.driver.find_element_by_xpath("//button[contains(text(), 'Plus tard')]").click()

    def get_followers(self):

        self.driver.find_element_by_xpath("//a[contains(@href, '/{}')]".format(self.username)).click()

        wait = WebDriverWait(self.driver, 10)

        wait.until(EC.presence_of_element_located((By.XPATH, "//a[contains(@href, '/following/')]")))

        self.driver.find_element_by_xpath("//a[contains(@href, '/followers/')]").click()

        wait.until(EC.presence_of_element_located((By.XPATH, "/html/body/div[4]/div/div[2]")))

        scroll_box = self.driver.find_element_by_xpath("/html/body/div[4]/div/div[2]")

        last_ht, ht = 0, 1

        while last_ht != ht:
            last_ht = ht
            sleep(2)
            ht = self.driver.execute_script(
                """arguments[0].scrollTo(0, arguments[0].scrollHeight);return arguments[0].scrollHeight""",
                scroll_box)  # ajouter les " trois fois

        links = scroll_box.find_elements_by_tag_name('a')
        names = [name.text for name in links if name.text != '']

        return names

    def contact(self, nom=pseudo, message=message):

        tab = self.get_followers()

        if nom in tab:
            print(nom)
            self.driver.find_element_by_xpath("//a[contains(@href, '/" + nom + "/')]").click()

        # print(tab)

        wait = WebDriverWait(self.driver, 10)
        wait.until(EC.presence_of_element_located((By.XPATH, "//button[contains(text(), 'Contacter')]")))

        self.driver.find_element_by_xpath("//button[contains(text(), 'Contacter')]").click()

        wait.until(EC.presence_of_element_located((By.XPATH,
                                                   "/html/body/div[1]/section/div/div[2]/div/div/div[2]/div[2]/div/div[2]/div/div/div[2]/textarea")))
        text_input = self.driver.find_element_by_xpath(
            "/html/body/div[1]/section/div/div[2]/div/div/div[2]/div[2]/div/div[2]/div/div/div[2]/textarea")

        text_input.send_keys(message, Keys.RETURN)

    def messageRecu(self, message=message):
        wait = WebDriverWait(self.driver, 10)

        scroll_box = self.driver.find_element_by_xpath(
            "/html/body/div[1]/section/div/div[2]/div/div/div[2]/div[2]/div/div[1]/div")

        sleep(5)

        span1 = scroll_box.find_elements_by_tag_name('span')
        span2 = scroll_box.find_elements_by_tag_name('span')

        print(len(span1))
        print(len(span2))

        uie = [ui.text for ui in span2 if ui.text != '']
        print(uie)
        print("---------------------------------------------")

        while len(span1) == len(span2) and uie[-1] == message:
            sleep(12)
            span5 = scroll_box.find_elements_by_tag_name('span')
            if len(span1) != len(span5):
                span4 = scroll_box.find_elements_by_tag_name('span')
                z = [a.text for a in span4 if a.text != '']
                print(z)
                if z[-1] == "En train d'écrire...":
                    print("ca modifie la")
                elif z[-1] != "En train d'écrire...":
                    break

        self.refreshFunction()

    def refreshFunction(self, message=message, pseudo=pseudo):
        wait = WebDriverWait(self.driver, 10)
        self.driver.refresh()

        wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(text(),'" + pseudo + "')]")))
        self.driver.find_element_by_xpath("//div[contains(text(),'" + pseudo + "')]").click()

        wait.until(EC.presence_of_element_located(
            (By.XPATH, "/html/body/div[1]/section/div/div[2]/div/div/div[2]/div[2]/div/div[1]/div")))

        scroll_box2 = self.driver.find_element_by_xpath(
            "/html/body/div[1]/section/div/div[2]/div/div/div[2]/div[2]/div/div[1]/div")

        wait.until(EC.presence_of_element_located((By.TAG_NAME, "span")))
        span3 = scroll_box2.find_elements_by_tag_name("span")
        names = [name.text for name in span3 if name.text != '']
        print(len(names))
        print(names)

        leMessage = names[-1]

        if leMessage == message:
            self.messageRecu()
        else:
            print(leMessage)
            text_input = self.driver.find_element_by_xpath(
                "/html/body/div[1]/section/div/div[2]/div/div/div[2]/div[2]/div/div[2]/div/div/div[2]/textarea")

            text_input.send_keys("Wait ...",
                                 Keys.RETURN)

            sleep(1)

            self.recherche(leMessage)

    def recherche(self, m):
        wait = WebDriverWait(self.driver, 10)
        self.driver2.get("https://www.google.fr/imghp?hl=fr")

        searchbar = self.driver2.find_element_by_xpath(
            "/html/body/div/div[3]/div[2]/form/div[2]/div[1]/div[1]/div/div[2]/input")
        searchbar.send_keys(str(m) + " drapeau", Keys.RETURN)

        sleep(2)

        url = self.driver2.current_url

        print(url)

        text_input = self.driver.find_element_by_xpath(
            "/html/body/div[1]/section/div/div[2]/div/div/div[2]/div[2]/div/div[2]/div/div/div[2]/textarea")

        text_input.send_keys("Here the flag of your favorite country !\n" + url + "\nAre you satisfied ?", Keys.RETURN)


my_Bot = InstaBot('id', 'mdp')
my_Bot.contact()
my_Bot.messageRecu()
