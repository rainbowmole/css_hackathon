from django.urls import path

from . import views

urlpatterns = [
    path('register/', views.register, name='api_register'),
    path('login/', views.login_view, name='api_login'),
    path('logout/', views.logout_view, name='api_logout'),
    path('check-auth/', views.check_auth, name='api_check_auth'),
    path('profile/', views.get_user_profile, name='api_get_user_profile'),
    path('profile/update/', views.update_user_profile, name='api_update_user_profile'),
    path('profile/photo/', views.upload_profile_photo, name='api_upload_profile_photo'),
    path('role/switch/', views.switch_role, name='api_switch_role'),
    path('freelancers/', views.get_freelancers, name='api_get_freelancers'),
    path('freelancers/<int:freelancer_id>/', views.get_freelancer_detail, name='api_get_freelancer_detail'),
]
