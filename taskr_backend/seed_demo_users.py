#!/usr/bin/env python
"""Seed script to create demo users for local testing"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'taskr_backend.settings')
django.setup()

from accounts.models import User, Profile, Skill, UserSkill

# Demo user data
DEMO_USERS = [
    {
        'email': 'alex@reyesdesign.co',
        'first_name': 'Alex',
        'last_name': 'Reyes',
        'role': 'both',
        'current_active_role': 'freelancer',
        'title': 'Brand & UI Designer',
        'bio': 'I help startups build strong visual identities. 10+ years in design.',
        'hourly_rate': 85,
        'min_budget': 500,
        'category': 'Design',
        'skills': ['Figma', 'Brand Strategy', 'UI Design'],
        'availability': True,
        'portfolio_url': 'https://alexreyes.design',
    },
    {
        'email': 'sam@torresdev.io',
        'first_name': 'Sam',
        'last_name': 'Torres',
        'role': 'freelancer',
        'current_active_role': 'freelancer',
        'title': 'Full-stack Developer',
        'bio': 'I build scalable web apps and product MVPs. Specializing in React & Node.js.',
        'hourly_rate': 95,
        'min_budget': 1000,
        'category': 'Development',
        'skills': ['React', 'Node.js', 'PostgreSQL'],
        'availability': True,
        'portfolio_url': 'https://samtorres.dev',
    }
]

PASSWORD = 'Demo123!'

def seed():
    for user_data in DEMO_USERS:
        email = user_data['email']
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name'],
                'role': user_data['role'],
                'current_active_role': user_data['current_active_role'],
            }
        )
        
        # Update user
        user.first_name = user_data['first_name']
        user.last_name = user_data['last_name']
        user.role = user_data['role']
        user.current_active_role = user_data['current_active_role']
        user.username = email
        user.set_password(PASSWORD)
        user.save()
        
        # Update or create profile
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.title = user_data['title']
        profile.bio = user_data['bio']
        profile.hourly_rate = user_data['hourly_rate']
        profile.min_budget = user_data['min_budget']
        profile.category = user_data['category']
        profile.availability = user_data['availability']
        profile.portfolio_url = user_data['portfolio_url']
        profile.save()
        
        # Clear and recreate skills
        UserSkill.objects.filter(user=user).delete()
        for skill_name in user_data['skills']:
            skill, _ = Skill.objects.get_or_create(
                name=skill_name,
                defaults={'category': 'development'}
            )
            UserSkill.objects.create(user=user, skill=skill)
        
        action = '✅ Created' if created else '✅ Updated'
        print(f'{action} demo user: {email}')
    
    print(f'\n✅ All demo users seeded successfully!')
    print(f'Demo credentials: email / {PASSWORD}')

if __name__ == '__main__':
    seed()
