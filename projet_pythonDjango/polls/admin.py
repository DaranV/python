from django.contrib import admin
from .models import Client
from .models import Commande
from .models import Bagel
from .models import Complement

admin.site.register(Client)
admin.site.register(Commande)
admin.site.register(Bagel)
admin.site.register(Complement)