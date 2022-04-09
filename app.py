from flask import Flask, render_template, redirect, url_for, session, g, flash, request
from forms import RegistrationForm, LoginForm, PasswordForm
from database import get_db, close_db
from flask_session import Session
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

# One type of user only - to login as a regular user, sign up and then log in!
# You can play the game when not logged in, but if you want to compete against other players, you must sign up and log in.

app = Flask(__name__)
app.config["SECRET_KEY"] = "so-secret-tea"
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

@app.teardown_appcontext
def close_db_at_end_of_requests(e=None):
    close_db(e)

@app.before_request
def logged_in():
    g.user = session.get("username", None)

def login_required(view):
    @wraps(view)
    def wrapped_view(**kwargs):
        if g.user is None:
            return redirect(url_for("login"))
        return view(**kwargs)
    return wrapped_view

# 404 error page
@app.errorhandler(404)
def page_not_found(e):
    return render_template('oh_no.html', title="Error"), 404

# Home page
@app.route("/")
def index():
    db = get_db() 
    user = db.execute("""SELECT * FROM users WHERE username = ?;""", (g.user,)).fetchone()
    users_table1 = db.execute("""SELECT * FROM users ORDER BY easy_highscore DESC limit 10;""")
    users_table2 = db.execute("""SELECT * FROM users ORDER BY hard_highscore DESC limit 10;""")
    rank = [i for i in range(1,11)]
    return render_template("index.html", title="Home", user=user, users_table1=users_table1, users_table2=users_table2, rank=rank)

# Game pages
@app.route("/easy")
def easy():
    db = get_db() 
    user = db.execute("""SELECT * FROM users WHERE username = ?;""", (g.user,)).fetchone()
    return render_template("easylvl.html", title="Game", user=user)
@app.route("/hard")
def hard():
    db = get_db() 
    user = db.execute("""SELECT * FROM users WHERE username = ?;""", (g.user,)).fetchone()
    return render_template("hardlvl.html", title="Game", user=user)

# Store scores
@app.route("/store_score_easylvl", methods=["POST"])
def store_score_easylvl():
    current_score = int(request.form["current_score"])

    if g.user is None:
        return "nothing"
    else:
        db = get_db()
        user = db.execute("""SELECT * FROM users WHERE username = ?;""", (g.user,)).fetchone() 
        if user["easy_highscore"] <= current_score:
            db.execute("""UPDATE users SET easy_highscore=? WHERE username=?;""", (current_score,g.user))
            db.commit()
    return "success"

@app.route("/store_score_hardlvl", methods=["POST"])
def store_score_hardlvl():
    current_score = int(request.form["current_score"])

    if g.user is None:
        return "nothing"
    else:
        db = get_db()
        user = db.execute("""SELECT * FROM users WHERE username = ?;""", (g.user,)).fetchone() 
        if user["hard_highscore"] <= current_score:
            db.execute("""UPDATE users SET hard_highscore=? WHERE username=?;""", (current_score,g.user))
            db.commit()
    return "success"

# User Profile
@app.route("/profile")
@login_required
def profile():
    db = get_db() 
    user = db.execute("""SELECT * FROM users WHERE username = ?;""", (g.user,)).fetchone()
    users_table1 = db.execute("""SELECT * FROM users ORDER BY easy_highscore DESC limit 10;""")
    users_table2 = db.execute("""SELECT * FROM users ORDER BY hard_highscore DESC limit 10;""")
    rank = [i for i in range(1,11)]
    return render_template("profile.html", title="Profile", user=user, users_table1=users_table1, users_table2=users_table2, rank=rank)

# Credits page
@app.route("/credits")
def credits():
    return render_template("credits.html", title="Credits")

# Register for an account
@app.route("/registration", methods=["GET", "POST"])
def registration():
    form = RegistrationForm()
    if form.validate_on_submit():
        username = form.username.data.strip()
        password = form.password.data
        easy_highscore = 0
        hard_highscore = 0

        db = get_db()
        if db.execute("""SELECT * FROM users WHERE username =?;""", (username,)).fetchone() is not None:
            form.username.errors.append("Sorry, the username you entered already exists, please create a new username.")
        elif password.isupper() or password.isdigit() or password.islower() or password.isalpha():
            form.password.errors.append("Create a STRONG password with one uppercase character, one lowercase character and one number")
        else:
            db.execute("""INSERT INTO users (username,password, easy_highscore, hard_highscore)
                        VALUES (?,?,?,?);""", (username,generate_password_hash(password), easy_highscore, hard_highscore))
            db.commit()
            flash("Successful Registration! Please login now")
            return redirect( url_for("login"))
    return render_template("register.html", form=form, title="Register")

# Login to account
@app.route("/login", methods=["GET", "POST"])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        username = form.username.data.strip()
        password = form.password.data
        
        db = get_db() 
        user = db.execute("""SELECT * FROM users WHERE username = ?;""", (username,)).fetchone()

        if 'counter' not in session:
            session['counter'] = 0

        if user is None:
            form.username.errors.append("Username doesn't exist, please check your spelling")
        elif not check_password_hash(user["password"], password):
            form.password.errors.append("Incorrect password")
            session['counter'] = session.get('counter') + 1
            if session.get('counter')==3:
                flash('Oh no, are you having trouble logging in? Sucks to be you!')
                session.pop('counter', None)
        else:
            session.clear()
            session["username"] = username
            return redirect(url_for("profile"))
    return render_template("login.html", form=form, title="Login")

# Logout from account
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))

# Change password
@app.route("/change_password", methods=["GET", "POST"])
@login_required
def change_password():
    form = PasswordForm()
    if form.validate_on_submit():
        new_password = form.new_password.data

        db = get_db() 
        user = db.execute("""SELECT * FROM users WHERE username = ?;""", (g.user,)).fetchone()

        if new_password.isupper() or new_password.islower() or new_password.isdigit():
            form.new_password.errors.append("Create a STRONG password with one uppercase character, one lowercase character and one number")
        else:
            db.execute("""UPDATE users SET password=? WHERE username=?;""", (generate_password_hash(new_password),g.user))
            db.commit()
            session.clear()
            flash("Successfully changed password! Please login now.")
            return redirect(url_for("login"))
    return render_template("change_password.html", title ="Change password", form=form)


if __name__ == '__main__':
   app.run(debug = True)