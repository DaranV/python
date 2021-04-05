from django.http import HttpResponse
from django.http import Http404
from django.shortcuts import render
from .models import *
import logging
from django.http import JsonResponse

logger = logging.getLogger(__name__)

def index(request):
    try:
        liste_commande = list(Commande.objects.all())
        context = {
                'liste_commande' : liste_commande,
                }
    except Commande.DoesNotExist:
            raise Http404("Il n'y a aucune commande")
    return render(request, 'polls/index.html', context)

def commander(request):
    liste_client = list(Client.objects.all())    
    liste_bagel = list(Bagel.objects.all())   
    liste_complement = list(Complement.objects.all()) 

    context = {
        'liste_client' : liste_client,
        'liste_bagel' : liste_bagel,
        'liste_complement' : liste_complement,
        'success': False
    }
    
    tab_cl = tuple(liste_client)
    tab_bagel = tuple(liste_bagel)
    tab_complement = tuple(liste_complement)

    if request.method == 'POST':
        if 'client' in request.POST:
            client = int(request.POST['client'])
            tmp = False
            for cl in liste_client:
                if cl.idClient == client:
                    tmp = True
                    client = cl

            
        if 'adresse' in request.POST:
            adresse = request.POST['adresse']
        else:
            adresse = False         

        if 'bagel' in request.POST:
            bagel = request.POST['bagel']
            if bagel != 'italien' and bagel != 'normal' and bagel != 'complet' and bagel != 'bio' and bagel != 'campagnard':
               bagel = False
            
        else:
            bagel = False   
            
        if 'complement' in request.POST:
            complement = int(request.POST['complement'])
            tmp = False
            for c in liste_complement:
                if c.idComplement == complement:
                    tmp = True
                    complement = c

            if tmp == False:
                complement = False
        else:
            complement = False     

            


        if client != False:
            if adresse != False:
                if bagel != False:
                    if complement != False:
                        if complement.stock > 0:
                            complement.stock -= 1
                            complement.save()

                            b = Bagel(typePain=bagel, complement=complement)
                            b.save()
                            b.stock -= 1
                            b.save()
                            cmd = Commande(adresse=adresse, client=client, bagel=b)
                            cmd.save()
                            context['success'] = "La commande a bien été enregistrée"
                            return render(request, 'polls/commander.html', context)

        return JsonResponse({
            'error': True
            })
    else:
        return render(request, 'polls/commander.html', context)

    
def supprimer(request):    
    liste_commande = list(Commande.objects.all()) 

    context = {
        'liste_commande' : liste_commande,
        'success': False
    }

    if request.method == 'POST':
        if 'commande' in request.POST:
            commande = int(request.POST['commande'])
            tmp = False
            for c in liste_commande:
                if c.idCommande == commande:
                    tmp = True
                    commande = c

            if tmp == False:
                commande = False
        else:
            commande = False 

        if commande != False:
            commande.delete()  
            context['success'] = "La commande a bien été supprimée"
            return render(request, 'polls/supprimer.html', context)

        return JsonResponse({
            'error': True
            })



    else:
        return render(request, 'polls/supprimer.html', context)