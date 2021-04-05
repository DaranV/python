from datetime import datetime
from datetime import date

from django.db import models
from django.utils import timezone

class Client(models.Model):
    idClient = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=20)
    prenom = models.CharField(max_length=20)
    mail = models.EmailField(max_length=30)
    nom = models.CharField(max_length=20)
    dateCreation = models.DateTimeField(default=datetime.now)
    
    def __str__(self):
        return "Nom : " + self.nom + " ; Prenom : " + self.prenom
    
class Complement(models.Model):
    idComplement = models.AutoField(primary_key=True)
    nomComplement = models.CharField(max_length=20)
    stock = models.IntegerField(default=100) 
    
    def __str__(self):
        return self.nomComplement + " ; En stock : " + self.stock.__str__()
    
class Bagel(models.Model):
    idBagel = models.AutoField(primary_key=True) 
    typePain = models.CharField(max_length=20)
    stock = models.IntegerField(default=50)
    complement = models.ForeignKey(Complement, on_delete=models.CASCADE)
  
        
    def __str__(self):
        return self.typePain + " complément " + self.complement.__str__()
    
    
class Commande(models.Model):
    idCommande = models.AutoField(primary_key=True)
    adresse = models.CharField(max_length=100)
    dateCommande = models.DateTimeField(default=datetime.now)
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    bagel = models.ForeignKey(Bagel, on_delete=models.CASCADE) 
        
    def __str__(self):
        return "Commande numéro " + self.idCommande.__str__() +" par " + self.client.__str__()

    
    
    
    
        