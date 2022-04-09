from flask_wtf import FlaskForm 
from wtforms import StringField, PasswordField, SubmitField, validators
from wtforms.validators import InputRequired, EqualTo

class RegistrationForm(FlaskForm):
    username = StringField('Username', [validators.Length(min=5, max=25)])
    password = PasswordField("Password", validators=[InputRequired()])
    password2 = PasswordField("Confirm password", validators=[InputRequired("Password doesn't match"), EqualTo("password")])
    submit = SubmitField("Register")

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[InputRequired("Username doesn't exist")])
    password = PasswordField("Password", validators=[InputRequired()])
    password2 = PasswordField("Confirm password", validators=[InputRequired("Password doesn't match"), EqualTo("password")])
    submit = SubmitField("Login")

class PasswordForm(FlaskForm):
    new_password = PasswordField("New Password", validators=[InputRequired()])
    password2 = PasswordField("Confirm new password", validators=[InputRequired("Password doesn't match"), EqualTo("new_password")])
    submit = SubmitField("Change password")