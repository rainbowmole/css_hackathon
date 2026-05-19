from django.contrib import admin
from .models import User, Profile, Skill, UserSkill, BotTrigger, ChatHistory


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
	list_display = ('email', 'first_name', 'last_name', 'role', 'current_active_role', 'is_active', 'created_at')
	list_filter = ('role', 'is_active', 'created_at')
	search_fields = ('email', 'first_name', 'last_name')
	readonly_fields = ('created_at', 'updated_at')


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
	list_display = ('user', 'category', 'hourly_rate', 'availability', 'created_at')
	list_filter = ('category', 'availability', 'created_at')
	search_fields = ('user__email', 'category')
	readonly_fields = ('created_at', 'updated_at')


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
	list_display = ('name', 'category')
	list_filter = ('category',)
	search_fields = ('name',)


@admin.register(UserSkill)
class UserSkillAdmin(admin.ModelAdmin):
	list_display = ('user', 'skill', 'created_at')
	list_filter = ('skill__category', 'created_at')
	search_fields = ('user__email', 'skill__name')


@admin.register(BotTrigger)
class BotTriggerAdmin(admin.ModelAdmin):
	list_display = ('trigger_name', 'user', 'is_enabled', 'created_at')
	list_filter = ('is_enabled', 'created_at')
	search_fields = ('user__email', 'trigger_name')


@admin.register(ChatHistory)
class ChatHistoryAdmin(admin.ModelAdmin):
	list_display = ('sender', 'recipient', 'is_from_ai', 'created_at')
	list_filter = ('is_from_ai', 'created_at')
	search_fields = ('sender__email', 'recipient__email')
	readonly_fields = ('created_at',)
