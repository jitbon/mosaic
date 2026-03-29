from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class UserPreferenceOut(BaseModel):
    default_perspective: Optional[str] = None
    notification_prefs: Dict[str, Any] = {}


class ProfileResponse(BaseModel):
    user_id: str
    email: str
    display_name: str
    email_verified: bool
    preferences: UserPreferenceOut
    linked_providers: List[str]
    created_at: datetime
    last_login_at: Optional[datetime] = None


class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    preferences: Optional[UserPreferenceOut] = None

    def model_post_init(self, __context: Any) -> None:
        if self.display_name is not None:
            self.display_name = self.display_name.strip()
            if not self.display_name or len(self.display_name) > 100:
                raise ValueError("display_name must be 1–100 characters")


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class DeleteAccountRequest(BaseModel):
    confirm: bool
