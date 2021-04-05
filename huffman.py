from heapq import heappush, heappop, heapify
from collections import defaultdict


class Arbre:
    def __init__(self, frequence, gauche, droite):
        """Construit un Arbre
        frequence: int
        gauche, droite: c'est des Arbres
        """

        self.frequence = frequence
        self.gauche = gauche
        self.droite = droite

    def affiche(self, prefixes=['   ']):
        """Affiche l'arbre """
        print(''.join(prefixes[:-1]) + '|___' + str(self.frequence))
        prefixes.append('|   ')
        self.gauche.affiche(prefixes)
        prefixes.pop()
        prefixes.append('   ')
        self.droite.affiche(prefixes)
        prefixes.pop()


class Feuille(Arbre):
    def __init__(self, frequence, symbole):
        """construit une Feuille
        frequence : int
        symbole : str
        """
        Arbre.__init__(self, frequence, None, None)  # init d'Arbre
        self.symbole = symbole

    def affiche(self, prefixes=['   ']):
        """ Affiche la feuille """
        print(''.join(prefixes[:-1]) + '|___' + str(self.frequence) + '(' + self.symbole + ')')


A = Arbre(18, Arbre(8, Arbre(3, Feuille(1, 'd'), Feuille(2, 'c')), Feuille(5, 'b')),
          Feuille(10, 'a'))  # Quand on fait un arbre on sait qu'il aura des feuilles


# A.affiche()


class Huffman:
    """ Construction arbre de Huffman"""

    def __init__(self, frequences):
        """ Constructeur
            frequences: dico des fréquences
        """
        self.foret = []
        listeTrie = []
        self.foret = [(frequence, symbole) for frequence, symbole in frequences.items()]
        heapify(self.foret)

        taille = len(self.foret)

        print(self.foret)

        print("taille : " + str(taille))

    def pop_min(self):
        listeTrie = sorted(self.foret, key=lambda l: l[1])

        print(listeTrie)

        # plus petit element retiré
        low1 = min(listeTrie)
        listeTrie.remove(min(listeTrie))
        low2 = min(listeTrie)
        listeTrie.remove(min(listeTrie))

        # self.foret.remove(min(self.foret))
        print(low1)
        print(low2)

        print(listeTrie)

    def fusion(self):
        """
        liste = self.foret
        key = []  # liste des symboles
        value = []  # liste des fréquences

        for elem in range(0, len(liste)):
            if liste[elem][1] != 0:
                key.append(liste[elem][0])
                value.append(liste[elem][1])
        valueTrie = sorted(value)
        print(valueTrie)
        """
        print(self.foret)

        while len(self.foret) > 1:
            freq1, gauche = heappop(self.foret)
            freq2, droite = heappop(self.foret)
            heappush(self.foret, (freq1 + freq2, {'gauche': gauche, 'droite': droite}))

        print(self.foret)

    def encode_ascii(txt):
        encode = ""
        for lettre in txt:  # on parcours le string
            ui = ord(lettre)  # renvoi l'entier du codage ASCII
            encode += "{:08b}".format(ui)  # concatène avc le string
        print(encode)

    # Nombre d'apparition du caractère
    def frequence(txt):
        symb2weight = defaultdict(int)
        for ch in txt:
            symb2weight[ch] += 1

        for key, value in symb2weight.items():
            print(key + ' : ' + str(value))

        return symb2weight

    def tabledecodage(symb2weight):
        # liste des poids, symboles et code (vide initialement)
        heap = [[weight, [symb, ""]] for symb, weight in symb2weight.items()]
        heapify(heap)  # tri par poids croissant
        while len(heap) > 1:
            low = heappop(heap)
            high = heappop(heap)
            # print(low,high) # deux elements les moins frequents
            for pair in low[1:]:
                pair[1] = '0' + pair[1]
            for pair in high[1:]:
                pair[1] = '1' + pair[1]
            heappush(heap, [low[0] + high[0]] + low[1:] + high[1:])
        resultat = sorted(heappop(heap)[1:], key=lambda p: (len(p[-1]), p))
        return resultat

    txt = "ABRACADABRA"

    symb2weight = frequence(txt)

    huff = tabledecodage(symb2weight)
    print("Symbole\t Nb occurences \t Code Huffman")
    for p in huff:
        print("%s \t %s \t\t %s" % (p[0], symb2weight[p[0]], p[1]))

    print("-------------------")

    def comp(huff, text):
        res = ""
        for i in range(len(text)):
            for k in huff:
                if k[0] == text[i]:
                    res += k[1]
        return res

    def decomp(huff, text):
        res = ""
        while text:
            for k in huff:
                if text.startswith(k[1]):
                    res += k[0]
                    text = text[len(k[1]):]
        return res

    textbin = comp(huff, txt)
    print('compression du texte en binaire :', textbin)
    print("decompression du texte en binaire : ", decomp(huff, textbin))


texte = 'dddddddddiiirrrlllqqccn'
freq = Huffman.frequence(texte)
H = Huffman(freq)
H.pop_min()
H.fusion()

# Huffman.encode_ascii("bonjour")
