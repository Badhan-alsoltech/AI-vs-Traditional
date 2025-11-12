# app.py — Supabase integrated version
from flask import Flask, render_template, send_from_directory, abort, request, jsonify, Response
import os, csv, io, datetime
from supabase import create_client

# === Supabase Configuration ===
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("❌ Missing Supabase credentials. Add SUPABASE_URL and SUPABASE_KEY in Render Environment Variables.")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# === Flask App Config ===
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
EXTERNAL_IMAGE_DIR = os.path.join(PROJECT_DIR, "assets", "images")

app = Flask(
    __name__,
    static_folder="screens",
    template_folder="screens"
)

# === Utility functions ===
def safe_int(v):
    try:
        return int(v) if v not in (None, "", "null") else None
    except:
        return None

def safe_float(v):
    try:
        return float(v) if v not in (None, "", "null") else None
    except:
        return None


# ========== API: Submit Survey ==========
@app.route("/api/submit_survey", methods=["POST"])
def api_submit_survey():
    """Handles survey submission and saves it to Supabase."""
    try:
        data = request.get_json(force=True)
        if not isinstance(data, dict):
            return jsonify({"error": "Invalid JSON payload"}), 400

        # Mapping from frontend keys → DB columns
        mapping = {
            "aiKnowledge": "ai_knowledge",
            "aiMugPrice": "ai_mug_price",
            "humanMugPrice": "human_mug_price"
        }

        record = {}
        for k, v in data.items():
            key = mapping.get(k, k)
            if key.startswith(("awareness", "preference", "wtp", "comparative")) or key == "age":
                record[key] = safe_int(v)
            elif key in ("ai_mug_price", "human_mug_price"):
                record[key] = safe_float(v)
            else:
                record[key] = v if v not in (None, "", "null") else None

        response = supabase.table("survey_responses").insert(record).execute()
        if response.data:
            return jsonify({"success": True, "message": "Survey saved to Supabase."}), 200
        else:
            return jsonify({"error": "Failed to insert data"}), 500

    except Exception as e:
        print("❌ Error saving survey:", e)
        return jsonify({"error": str(e)}), 500


# ========== API: Admin Data ==========
@app.route("/api/admin/data")
def api_admin_data():
    """Returns aggregate and submission data from Supabase."""
    try:
        response = supabase.table("survey_responses").select("*").execute()
        rows = response.data or []

        sections = {
            "awareness": [f"awareness{i}" for i in range(1, 9)],
            "preferences": [f"preference{i}" for i in range(1, 9)],
            "wtp": [f"wtp{i}" for i in range(1, 9)],
            "comparative": [f"comparative{i}" for i in range(1, 9)],
        }

        aggregates = {}
        for section, cols in sections.items():
            vals = []
            for c in cols:
                valid_nums = [r[c] for r in rows if r.get(c) is not None]
                avg = round(sum(valid_nums) / len(valid_nums), 2) if valid_nums else 0
                vals.append(avg)
            aggregates[section] = vals

        submissions = [
            {
                "id": r.get("id"),
                "created_at": r.get("created_at"),
                "age": r.get("age"),
                "gender": r.get("gender"),
                "education": r.get("education"),
                "occupation": r.get("occupation"),
                "income": r.get("income"),
            }
            for r in rows
        ]

        return jsonify({"aggregates": aggregates, "submissions": submissions})

    except Exception as e:
        print("❌ Error fetching data:", e)
        return jsonify({"error": str(e)}), 500


# ========== API: Export Data ==========
@app.route("/api/admin/export")
def api_admin_export():
    """Exports all survey data from Supabase as CSV."""
    try:
        response = supabase.table("survey_responses").select("*").execute()
        rows = response.data or []

        output = io.StringIO()
        writer = csv.writer(output)

        if rows:
            headers = list(rows[0].keys())
            writer.writerow(headers)
            for r in rows:
                writer.writerow([r.get(h) for h in headers])
        else:
            writer.writerow(["No data found"])

        csv_data = output.getvalue()
        output.close()

        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"survey_export_{timestamp}.csv"

        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment;filename={filename}"}
        )
    except Exception as e:
        print("❌ Export error:", e)
        return jsonify({"error": str(e)}), 500


# ========== Pages ==========
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


# ========== Assets ==========
@app.route("/assets/<path:filename>")
def project_assets(filename):
    return send_from_directory(os.path.join(PROJECT_DIR, "assets"), filename)


# ========== Optional: Test Connection ==========
@app.route("/api/test_connection")
def test_connection():
    """Check if Supabase connection is live."""
    try:
        test = supabase.table("survey_responses").select("*").limit(1).execute()
        return jsonify({"connected": True, "rows_found": len(test.data)})
    except Exception as e:
        return jsonify({"connected": False, "error": str(e)}), 500


# === Run server ===
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
