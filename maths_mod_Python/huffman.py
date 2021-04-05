from heapq import heappush, heappop, heapify
from collections import defaultdict

class Huffman:

    # Nombre d'apparition du caractère
    def comptage(txt):
        symb2weight = defaultdict(int)
        for ch in txt:
            symb2weight[ch] += 1
        return symb2weight


    def codehuffman(symb2weight):
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

    symb2weight = comptage(txt)

    huff = codehuffman(symb2weight)
    print("Symbole\t Nb occurences \t Code Huffman")
    for p in huff:
        print("%s \t %s \t\t %s" % (p[0], symb2weight[p[0]], p[1]))


    print("-------------------")

    def comp(huff,text):
        res=""
        for i in range(len(text)):
            for k in huff:
                if k[0]==text[i]:
                    res+=k[1]
        return res
    def decomp(huff,text):
        res=""
        while text:
            for k in huff:
                if text.startswith(k[1]):
                    res+=k[0]
                    text=text[len(k[1]):]
        return res

    textbin=comp(huff,txt)
    print('compression du texte en binaire :',textbin)
    print("decompression du texte en binaire : ",decomp(huff,textbin))