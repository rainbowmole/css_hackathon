from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('index.html', views.index),
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('customer/', views.customer_page, name='customer_page'),
    path('customer.html', views.customer_page),
    path('freelancer/', views.freelancer_page, name='freelancer_page'),
    path('freelancer.html', views.freelancer_page),
]
