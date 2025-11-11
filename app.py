# app.py
from flask import Flask, render_template, send_from_directory, abort, request, jsonify, Response
import os, threading, webbrowser, sqlite3, csv, io, datetime

# === Configure paths ===
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.path.join(PROJECT_DIR, "db")
DB_PATH = os.path.join(DB_DIR, "survey.db")
EXTERNAL_IMAGE_DIR = r"C:\Human-vs-AI\assets\images"  # adjust if needed

app = Flask(
    __name__,
    static_folder="screens",
    template_folder="screens"
)

# === Schema (original schema without the open-ended wtp_factors) ===
SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS survey_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Demographics
    age INTEGER,
    gender TEXT,
    education TEXT,
    occupation TEXT,
    income TEXT,
    country TEXT,
    ai_knowledge TEXT,

    -- Awareness & Perceptions (8)
    awareness1 INTEGER,
    awareness2 INTEGER,
    awareness3 INTEGER,
    awareness4 INTEGER,
    awareness5 INTEGER,
    awareness6 INTEGER,
    awareness7 INTEGER,
    awareness8 INTEGER,

    -- Preferences & Attitudes (8)
    preference1 INTEGER,
    preference2 INTEGER,
    preference3 INTEGER,
    preference4 INTEGER,
    preference5 INTEGER,
    preference6 INTEGER,
    preference7 INTEGER,
    preference8 INTEGER,

    -- Willingness to Pay (8)
    wtp1 INTEGER,
    wtp2 INTEGER,
    wtp3 INTEGER,
    wtp4 INTEGER,
    wtp5 INTEGER,
    wtp6 INTEGER,
    wtp7 INTEGER,
    wtp8 INTEGER,

    ai_mug_price REAL,
    human_mug_price REAL,

    -- Comparative Analysis (8)
    comparative1 INTEGER,
    comparative2 INTEGER,
    comparative3 INTEGER,
    comparative4 INTEGER,
    comparative5 INTEGER,
    comparative6 INTEGER,
    comparative7 INTEGER,
    comparative8 INTEGER
);
"""

# ========== Helpers ==========

def ensure_db():
    """Ensure db directory and DB file + schema exist."""
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.executescript(SCHEMA_SQL)
        conn.commit()
    finally:
        conn.close()

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def safe_int(v):
    try:
        if v is None or v == "":
            return None
        return int(v)
    except Exception:
        return None

def safe_float(v):
    try:
        if v is None or v == "":
            return None
        return float(v)
    except Exception:
        return None

# Ensure DB on startup
ensure_db()

# ========== Admin / API routes ==========

@app.route("/admin")
def admin():
    return render_template("admin.html")


@app.route("/api/admin/data")
def api_admin_data():
    conn = get_db_connection()
    sections = {
        "awareness": [f"awareness{i}" for i in range(1, 9)],
        "preferences": [f"preference{i}" for i in range(1, 9)],
        "wtp": [f"wtp{i}" for i in range(1, 9)],
        "comparative": [f"comparative{i}" for i in range(1, 9)],
    }

    aggregates = {}
    for key, cols in sections.items():
        means = []
        for c in cols:
            row = conn.execute(f"SELECT AVG(CAST({c} AS REAL)) as avg FROM survey_responses").fetchone()
            val = row["avg"] if row and row["avg"] is not None else 0
            means.append(round(val, 2))
        aggregates[key] = means

    rows = conn.execute(
        "SELECT id, created_at, age, gender, education, occupation, income FROM survey_responses ORDER BY created_at DESC"
    ).fetchall()
    submissions = []
    for r in rows:
        submissions.append({
            "id": r["id"],
            "created_at": r["created_at"],
            "age": r["age"],
            "gender": r["gender"],
            "education": r["education"],
            "occupation": r["occupation"],
            "income": r["income"],
        })

    conn.close()
    return jsonify({
        "aggregates": aggregates,
        "submissions": submissions,
    })


@app.route("/api/admin/response/<int:resp_id>")
def api_admin_response(resp_id):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM survey_responses WHERE id = ?", (resp_id,)).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "Not found"}), 404
    result = {k: row[k] for k in row.keys()}
    return jsonify(result)


@app.route("/api/admin/export")
def api_admin_export():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM survey_responses ORDER BY created_at DESC").fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)

    if rows:
        headers = rows[0].keys()
        writer.writerow(headers)
        for r in rows:
            writer.writerow([r[h] for h in headers])
    else:
        writer.writerow(["No data"])

    csv_data = output.getvalue()
    output.close()

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"survey_export_{timestamp}.csv"

    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename={filename}"}
    )


# ========== Survey submission endpoint (important) ==========

@app.route("/api/submit_survey", methods=["POST"])
def api_submit_survey():
    """
    Expects JSON body matching frontend keys:
    - age, gender, education, occupation, income, country, aiKnowledge
    - awareness1..8, preference1..8, wtp1..8
    - aiMugPrice, humanMugPrice
    - comparative1..8
    """
    try:
        data = request.get_json(force=True)
        if not isinstance(data, dict):
            return jsonify({"error": "Invalid JSON payload"}), 400

        # Frontend keys (what survey.js sends)
        frontend_keys = [
            "age", "gender", "education", "occupation", "income", "country", "aiKnowledge",
            *[f"awareness{i}" for i in range(1, 9)],
            *[f"preference{i}" for i in range(1, 9)],
            *[f"wtp{i}" for i in range(1, 9)],
            "aiMugPrice", "humanMugPrice",
            *[f"comparative{i}" for i in range(1, 9)]
        ]

        # Corresponding DB columns (snake_case)
        db_columns = [
            "age", "gender", "education", "occupation", "income", "country", "ai_knowledge",
            *[f"awareness{i}" for i in range(1, 9)],
            *[f"preference{i}" for i in range(1, 9)],
            *[f"wtp{i}" for i in range(1, 9)],
            "ai_mug_price", "human_mug_price",
            *[f"comparative{i}" for i in range(1, 9)]
        ]

        # Build values list in same order, with safe casting
        values = []
        for fk in frontend_keys:
            v = data.get(fk)
            # handle numeric conversions
            if fk == "age":
                values.append(safe_int(v))
            elif fk.startswith("awareness") or fk.startswith("preference") or fk.startswith("wtp") or fk.startswith("comparative"):
                values.append(safe_int(v))
            elif fk in ("aiMugPrice", "humanMugPrice"):
                values.append(safe_float(v))
            else:
                # plain string fields
                values.append(v if v is not None and v != "" else None)

        # Insert into DB
        conn = get_db_connection()
        cur = conn.cursor()
        placeholders = ",".join("?" * len(db_columns))
        sql = f"INSERT INTO survey_responses ({','.join(db_columns)}) VALUES ({placeholders})"
        cur.execute(sql, values)
        conn.commit()
        conn.close()

        return jsonify({"success": True, "message": "Survey saved successfully."}), 200

    except Exception as e:
        # Log to console for debugging
        print("❌ Error saving survey:", e)
        return jsonify({"error": str(e)}), 500


# ========== Static pages / asset routes ==========

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/gallery")
def gallery():
    return render_template("gallery.html")


@app.route("/compare")
def compare():
    return render_template("compare.html")


@app.route("/survey")
def survey():
    return render_template("survey.html")


@app.route("/questionnaire")
def questionnaire():
    return render_template("questionnaire.html")


@app.route("/assets/<path:filename>")
def project_assets(filename):
    return send_from_directory(os.path.join(PROJECT_DIR, "assets"), filename)


@app.route("/ext/<path:filename>")
def external_images(filename):
    safe_path = os.path.normpath(os.path.join(EXTERNAL_IMAGE_DIR, filename))
    if not safe_path.startswith(os.path.normpath(EXTERNAL_IMAGE_DIR)):
        return abort(403)
    if not os.path.exists(safe_path):
        return abort(404)
    directory, fname = os.path.split(safe_path)
    return send_from_directory(directory, fname)


# === Auto-open browser ===
def open_browser():
    webbrowser.open_new("http://127.0.0.1:5000/")


if __name__ == "__main__":
    threading.Timer(1, open_browser).start()
    print("🚀 Running on http://127.0.0.1:5000/")
    app.run(debug=True)
