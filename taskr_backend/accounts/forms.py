from django import forms
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
import re
from .models import User, Profile


class RegistrationForm(forms.ModelForm):
    """User registration form with password validation"""
    
    password = forms.CharField(
        widget=forms.PasswordInput,
        help_text="Password must contain at least one uppercase letter, one number, and one special character"
    )
    confirm_password = forms.CharField(
        widget=forms.PasswordInput,
        label="Confirm password"
    )
    role = forms.ChoiceField(
        choices=[('customer', 'Customer'), ('freelancer', 'Freelancer'), ('both', 'Both')],
        initial='customer'
    )
    
    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name')
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise ValidationError("This email is already registered.")
        return email
    
    def clean_password(self):
        password = self.cleaned_data.get('password')
        
        # Check minimum length
        if len(password) < 8:
            raise ValidationError("Password must be at least 8 characters long.")
        
        # Check for uppercase letter
        if not re.search(r'[A-Z]', password):
            raise ValidationError("Password must contain at least one uppercase letter.")
        
        # Check for number
        if not re.search(r'\d', password):
            raise ValidationError("Password must contain at least one number.")
        
        # Check for special character
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]', password):
            raise ValidationError("Password must contain at least one special character.")
        
        return password
    
    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        confirm_password = cleaned_data.get('confirm_password')
        
        if password and confirm_password and password != confirm_password:
            raise ValidationError("Passwords do not match.")
        
        return cleaned_data
    
    def save(self, commit=True):
        user = super().save(commit=False)
        password = self.cleaned_data.get('password')
        role = self.cleaned_data.get('role')
        
        # Use username field (required by AbstractUser)
        user.username = self.cleaned_data.get('email')
        user.set_password(password)  # Hash the password
        user.role = role
        user.current_active_role = 'customer' if role in ['customer', 'both'] else 'freelancer'
        
        if commit:
            user.save()
            # Create associated profile
            Profile.objects.create(user=user)
        
        return user


class LoginForm(forms.Form):
    """User login form"""
    
    email = forms.EmailField(label="Email")
    password = forms.CharField(widget=forms.PasswordInput)
    
    def clean(self):
        cleaned_data = super().clean()
        email = cleaned_data.get('email')
        password = cleaned_data.get('password')
        
        if email and password:
            # Check if user exists
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                raise ValidationError("Invalid email or password.")
            
            # Check password
            if not user.check_password(password):
                raise ValidationError("Invalid email or password.")
            
            if not user.is_active:
                raise ValidationError("This account has been disabled.")

        return cleaned_data


class ProfileForm(forms.ModelForm):
    """Profile update form"""
    
    class Meta:
        model = Profile
        fields = ('bio', 'portfolio_url', 'hourly_rate', 'min_budget', 'category', 
                  'availability', 'location', 'timezone', 'target_audience', 
                  'target_industry', 'notes')
        widgets = {
            'bio': forms.Textarea(attrs={'rows': 4}),
            'notes': forms.Textarea(attrs={'rows': 3}),
            'hourly_rate': forms.NumberInput(attrs={'step': '0.01'}),
            'min_budget': forms.NumberInput(attrs={'step': '0.01'}),
        }


class ProfilePhotoForm(forms.Form):
    """Profile photo upload form"""
    
    profile_photo = forms.ImageField(
        label='Upload Profile Photo',
        help_text='JPG, PNG (max 5MB)'
    )
    
    def clean_profile_photo(self):
        photo = self.cleaned_data.get('profile_photo')
        if photo:
            # Check file size (max 5MB)
            if photo.size > 5 * 1024 * 1024:
                raise ValidationError("File size must not exceed 5MB.")
        return photo


class UserForm(forms.ModelForm):
    """User profile info form (first_name, last_name, email)"""
    
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email')
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        # Check if email exists and belongs to another user
        if User.objects.filter(email=email).exclude(pk=self.instance.pk).exists():
            raise ValidationError("This email is already in use.")
        return email
