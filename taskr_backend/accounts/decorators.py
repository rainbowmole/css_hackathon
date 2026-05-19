from functools import wraps

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect


def role_required(allowed_roles):
    """Require authenticated user to have one of the allowed roles."""

    def decorator(view_func):
        @login_required(login_url='/login/')
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            user = request.user
            if user.role in allowed_roles:
                return view_func(request, *args, **kwargs)

            messages.error(request, 'You are not authorized to access this page.')
            return redirect('/')

        return _wrapped_view

    return decorator
