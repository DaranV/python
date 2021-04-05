from django.urls import path

from . import views

app_name = 'polls'
urlpatterns = [
        path('', views.index, name='index'),
        # Commander
        path('commander/', views.commander, name='commander'),
        # Supprimer 
        path('supprimer/', views.supprimer, name='supprimer'),
]