import base64
import json

from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_http_methods

from .decorators import role_required
from .forms import LoginForm, RegistrationForm
from .models import Profile, Skill, User, UserSkill


def _is_json_request(request):
    content_type = request.headers.get('Content-Type', '')
    return content_type.startswith('application/json')


def _name_from_user(user):
    full = f"{user.first_name} {user.last_name}".strip()
    return full or user.email


def index(request):
    if not request.user.is_authenticated:
        return render(request, 'index.html')

    user = request.user
    if user.current_active_role == 'freelancer' and user.role in ['freelancer', 'both']:
        return redirect('/freelancer.html')
    return redirect('/customer.html')


@require_http_methods(["GET", "POST"])
def register(request):
    if request.user.is_authenticated:
        return redirect('/')

    if request.method == 'POST':
        if _is_json_request(request):
            try:
                form = RegistrationForm(json.loads(request.body))
            except json.JSONDecodeError:
                return JsonResponse({'success': False, 'error': 'Invalid JSON payload.'}, status=400)

            if form.is_valid():
                user = form.save()
                login(request, user)
                return JsonResponse({
                    'success': True,
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'role': user.role,
                        'current_active_role': user.current_active_role,
                    },
                })
            return JsonResponse({'success': False, 'errors': form.errors}, status=400)

        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('/')
        return render(request, 'accounts/register.html', {'form': form})

    return render(request, 'accounts/register.html', {'form': RegistrationForm()})


@require_http_methods(["GET", "POST"])
def login_view(request):
    if request.user.is_authenticated:
        return redirect('/')

    if request.method == 'POST':
        if _is_json_request(request):
            try:
                payload = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({'success': False, 'error': 'Invalid JSON payload.'}, status=400)

            form = LoginForm(payload)
            if not form.is_valid():
                return JsonResponse({'success': False, 'errors': form.errors}, status=400)

            user = User.objects.get(email=payload.get('email'))
            login(request, user)
            return JsonResponse({
                'success': True,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'role': user.role,
                    'current_active_role': user.current_active_role,
                },
            })

        form = LoginForm(request.POST)
        if form.is_valid():
            user = User.objects.get(email=form.cleaned_data['email'])
            login(request, user)
            return redirect('/')
        return render(request, 'accounts/login.html', {'form': form})

    return render(request, 'accounts/login.html', {'form': LoginForm()})


@login_required(login_url='/login/')
@require_http_methods(["POST"])
def logout_view(request):
    logout(request)
    if _is_json_request(request):
        return JsonResponse({'success': True})
    return redirect('/login/')


@login_required(login_url='/login/')
@role_required(['customer', 'both'])
def customer_page(request):
    return render(request, 'customer.html')


@login_required(login_url='/login/')
@role_required(['freelancer', 'both'])
def freelancer_page(request):
    return render(request, 'freelancer.html')


@login_required(login_url='/login/')
@require_http_methods(["GET"])
def check_auth(request):
    user = request.user
    return JsonResponse({
        'authenticated': True,
        'user': {
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'current_active_role': user.current_active_role,
        },
    })


@login_required(login_url='/login/')
@require_http_methods(["GET"])
def get_user_profile(request):
    user = request.user
    profile, _ = Profile.objects.get_or_create(user=user)
    skills = list(UserSkill.objects.filter(user=user).values_list('skill__name', flat=True))

    return JsonResponse({
        'success': True,
        'user': {
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'role': user.role,
            'current_active_role': user.current_active_role,
        },
        'profile': {
            'bio': profile.bio or '',
            'title': profile.title or '',
            'portfolio_url': profile.portfolio_url or '',
            'hourly_rate': str(profile.hourly_rate),
            'min_budget': str(profile.min_budget),
            'category': profile.category or '',
            'availability': profile.availability,
            'location': profile.location or '',
            'timezone': profile.timezone or '',
            'target_audience': profile.target_audience or '',
            'target_industry': profile.target_industry or '',
            'notes': profile.notes or '',
            'profile_photo': profile.get_photo_url(),
        },
        'skills': skills,
    })


@login_required(login_url='/login/')
@require_http_methods(["POST"])
def update_user_profile(request):
    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON payload.'}, status=400)

    user = request.user
    profile, _ = Profile.objects.get_or_create(user=user)

    user.first_name = payload.get('first_name', user.first_name)
    user.last_name = payload.get('last_name', user.last_name)

    new_email = payload.get('email')
    if new_email and new_email != user.email:
        if User.objects.filter(email=new_email).exclude(pk=user.pk).exists():
            return JsonResponse({'success': False, 'error': 'Email already in use.'}, status=400)
        user.email = new_email
        user.username = new_email
    user.save()

    profile.bio = payload.get('bio', profile.bio)
    profile.title = payload.get('title', profile.title)
    profile.portfolio_url = payload.get('portfolio_url', profile.portfolio_url)
    profile.hourly_rate = payload.get('hourly_rate', profile.hourly_rate)
    profile.min_budget = payload.get('min_budget', profile.min_budget)
    profile.category = payload.get('category', profile.category)
    profile.availability = payload.get('availability', profile.availability)
    profile.location = payload.get('location', profile.location)
    profile.timezone = payload.get('timezone', profile.timezone)
    profile.target_audience = payload.get('target_audience', profile.target_audience)
    profile.target_industry = payload.get('target_industry', profile.target_industry)
    profile.notes = payload.get('notes', profile.notes)
    profile.save()

    if 'skills' in payload:
        UserSkill.objects.filter(user=user).delete()
        for raw_skill in payload.get('skills', []):
            skill_name = str(raw_skill).strip()
            if not skill_name:
                continue
            skill, _ = Skill.objects.get_or_create(name=skill_name, category='development')
            UserSkill.objects.create(user=user, skill=skill)

    return JsonResponse({'success': True})


@login_required(login_url='/login/')
@require_http_methods(["POST"])
def upload_profile_photo(request):
    if 'profile_photo' not in request.FILES:
        return JsonResponse({'success': False, 'error': 'No file uploaded.'}, status=400)

    photo = request.FILES['profile_photo']
    if photo.size > 5 * 1024 * 1024:
        return JsonResponse({'success': False, 'error': 'File must be <= 5MB.'}, status=400)

    allowed_types = {'image/jpeg', 'image/png', 'image/webp'}
    if photo.content_type not in allowed_types:
        return JsonResponse({'success': False, 'error': 'Only JPG, PNG, or WEBP images are allowed.'}, status=400)

    profile, _ = Profile.objects.get_or_create(user=request.user)
    profile.profile_photo = base64.b64encode(photo.read()).decode('utf-8')
    profile.save()

    return JsonResponse({
        'success': True,
        'photo_url': profile.get_photo_url(),
    })


@login_required(login_url='/login/')
@require_http_methods(["POST"])
def switch_role(request):
    user = request.user
    if user.role != 'both':
        return JsonResponse({'success': False, 'error': 'Role switch allowed only for dual-role users.'}, status=403)

    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON payload.'}, status=400)

    new_role = payload.get('role')
    if new_role not in ['customer', 'freelancer']:
        return JsonResponse({'success': False, 'error': 'Invalid role.'}, status=400)

    user.current_active_role = new_role
    user.save(update_fields=['current_active_role'])

    return JsonResponse({'success': True, 'current_active_role': new_role})


@login_required(login_url='/login/')
@require_http_methods(["GET"])
def get_freelancers(request):
    queryset = User.objects.filter(role__in=['freelancer', 'both']).select_related('profile')
    items = []

    for user in queryset:
        profile, _ = Profile.objects.get_or_create(user=user)
        items.append({
            'id': user.id,
            'name': _name_from_user(user),
            'email': user.email,
            'role': user.role,
            'title': profile.title or 'Freelancer',
            'bio': profile.bio or '',
            'portfolio_url': profile.portfolio_url or '',
            'hourly_rate': str(profile.hourly_rate),
            'min_budget': str(profile.min_budget),
            'category': profile.category or 'Development',
            'availability': profile.availability,
            'location': profile.location or '',
            'skills': list(UserSkill.objects.filter(user=user).values_list('skill__name', flat=True)),
            'profile_photo': profile.get_photo_url(),
        })

    return JsonResponse({'success': True, 'freelancers': items})


@login_required(login_url='/login/')
@require_http_methods(["GET"])
def get_freelancer_detail(request, freelancer_id):
    try:
        user = User.objects.get(id=freelancer_id, role__in=['freelancer', 'both'])
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Freelancer not found.'}, status=404)

    profile, _ = Profile.objects.get_or_create(user=user)
    return JsonResponse({
        'success': True,
        'freelancer': {
            'id': user.id,
            'name': _name_from_user(user),
            'email': user.email,
            'title': profile.title or 'Freelancer',
            'bio': profile.bio or '',
            'portfolio_url': profile.portfolio_url or '',
            'hourly_rate': str(profile.hourly_rate),
            'min_budget': str(profile.min_budget),
            'category': profile.category or 'Development',
            'availability': profile.availability,
            'location': profile.location or '',
            'timezone': profile.timezone or '',
            'target_audience': profile.target_audience or '',
            'target_industry': profile.target_industry or '',
            'skills': list(UserSkill.objects.filter(user=user).values_list('skill__name', flat=True)),
            'profile_photo': profile.get_photo_url(),
        },
    })
