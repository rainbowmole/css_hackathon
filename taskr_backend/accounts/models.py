from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
import base64


class User(AbstractUser):
	"""Custom user model with role support"""
    
	ROLE_CHOICES = [
		('customer', 'Customer'),
		('freelancer', 'Freelancer'),
		('both', 'Both'),
	]
    
	email = models.EmailField(unique=True)
	role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
	current_active_role = models.CharField(max_length=20, choices=[('customer', 'Customer'), ('freelancer', 'Freelancer')], default='customer')
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
    
	USERNAME_FIELD = 'email'
	REQUIRED_FIELDS = ['username']
    
	def __str__(self):
		return self.email


class Skill(models.Model):
	"""Skills catalog"""
    
	CATEGORY_CHOICES = [
		('design', 'Design'),
		('development', 'Development'),
		('writing', 'Writing'),
		('marketing', 'Marketing'),
		('photography', 'Photography'),
	]
    
	name = models.CharField(max_length=100)
	category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    
	class Meta:
		unique_together = ('name', 'category')
    
	def __str__(self):
		return f"{self.name} ({self.category})"


class Profile(models.Model):
	"""User profile with freelancer-specific information"""
    
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
	bio = models.TextField(blank=True, null=True)
	profile_photo = models.TextField(blank=True, null=True)  # Base64 encoded image
	title = models.CharField(max_length=120, blank=True, null=True)
	portfolio_url = models.URLField(blank=True, null=True)
	hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0, validators=[MinValueValidator(0)])
	min_budget = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
	category = models.CharField(max_length=100, blank=True, null=True)
	availability = models.BooleanField(default=True)
	location = models.CharField(max_length=200, blank=True, null=True)
	timezone = models.CharField(max_length=100, blank=True, null=True)
	target_audience = models.CharField(max_length=200, blank=True, null=True)
	target_industry = models.CharField(max_length=200, blank=True, null=True)
	notes = models.TextField(blank=True, null=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
    
	def __str__(self):
		return f"Profile of {self.user.email}"
    
	def get_photo_url(self):
		"""Return photo as data URI"""
		if self.profile_photo:
			return f"data:image/jpeg;base64,{self.profile_photo}"
		return None
    
	def set_photo_from_file(self, image_file):
		"""Store image as base64 from uploaded file"""
		if image_file:
			# Read file content
			img_data = image_file.read()
			# Encode to base64
			img_base64 = base64.b64encode(img_data).decode('utf-8')
			self.profile_photo = img_base64


class UserSkill(models.Model):
	"""Junction table for user-skill relationship"""
    
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skills')
	skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
	created_at = models.DateTimeField(auto_now_add=True)
    
	class Meta:
		unique_together = ('user', 'skill')
    
	def __str__(self):
		return f"{self.user.email} - {self.skill.name}"


class BotTrigger(models.Model):
	"""Bot notification trigger settings per user"""
    
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='bot_triggers')
	trigger_name = models.CharField(max_length=200)
	is_enabled = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
    
	def __str__(self):
		return f"Bot Trigger: {self.trigger_name} ({self.user.email})"


class ChatHistory(models.Model):
	"""Store chat conversations between users"""
    
	sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
	recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
	message = models.TextField()
	is_from_ai = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)
    
	class Meta:
		ordering = ['created_at']
    
	def __str__(self):
		return f"Chat: {self.sender.email} -> {self.recipient.email}"
