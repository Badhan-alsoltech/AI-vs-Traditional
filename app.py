# ===============================
# app.py — UPDATED for NEW SURVEY
# ===============================

from flask import Flask, render_template, send_from_directory, abort, request, jsonify, Response
import os, csv, io, datetime
from supabase import create_client

# === Supabase Configuration ===
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print("Starting Flask...")
print("SUPABASE_URL =", "OK" if SUPABASE_URL else "MISSING")
print("SUPABASE_KEY =", "OK" if SUPABASE_KEY else "MISSING")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Missing Supabase credentials.")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# === Flask Config ===
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask("HumanVsAI", static_folder="screens", template_folder="screens")


# === Utility ===
def safe_int(v):
    try: return int(v)
    except: return None

def safe_float(v):
    try: return float(v)
    except: return None


# ================================================
#  API: SAVE SURVEY RESPONSE
# ================================================
@app.route("/api/submit_survey", methods=["POST"])
def api_submit_survey():
    try:
        data = request.get_json(force=True)

        # Final database record
        record = {}

        # Direct demographic fields
        demographic_fields = [
            "age", "gender", "education", "occupation",
            "income", "country", "aiKnowledge"
        ]

        for f in demographic_fields:
            if f == "aiKnowledge":
                record["ai_knowledge"] = data.get(f)
            else:
                record[f] = data.get(f)

        # Awareness (8)
        for i in range(1, 9):
            record[f"awareness{i}"] = safe_int(data.get(f"awareness{i}"))

        # Prague WTP (4)
        for i in range(1, 5):
            record[f"prague_wtp{i}"] = safe_int(data.get(f"prague_wtp{i}"))

        # Prague Prices
        record["prague_ai_price"] = safe_float(data.get("pragueAiPrice"))
        record["prague_human_price"] = safe_float(data.get("pragueHumanPrice"))

        # New York WTP (4)
        for i in range(1, 5):
            record[f"newyork_wtp{i}"] = safe_int(data.get(f"newyork_wtp{i}"))

        # New York Prices
        record["newyork_ai_price"] = safe_float(data.get("newYorkAiPrice"))
        record["newyork_human_price"] = safe_float(data.get("newYorkHumanPrice"))

        # Insert into Supabase
        res = supabase.table("survey_responses").insert(record).execute()

        if res.data:
            return jsonify({"success": True}), 200
        return jsonify({"error": "Insert failed"}), 500

    except Exception as e:
        print("Error saving:", e)
        return jsonify({"error": str(e)}), 500


# ================================================
#  API: ADMIN AGGREGATES + SUBMISSION LIST
# ================================================
@app.route("/api/admin/data")
def api_admin_data():
    try:
        res = supabase.table("survey_responses").select("*").execute()
        rows = res.data or []

        # Aggregate structure
        aggregates = {
            "awareness": [],
            "prague_wtp": [],
            "newyork_wtp": []
        }

        # Awareness averages
        for i in range(1, 9):
            col = f"awareness{i}"
            vals = [safe_float(r[col]) for r in rows if r.get(col)]
            avg = round(sum(vals) / len(vals), 2) if vals else 0
            aggregates["awareness"].append(avg)

        # Prague WTP averages
        for i in range(1, 5):
            col = f"prague_wtp{i}"
            vals = [safe_float(r[col]) for r in rows if r.get(col)]
            avg = round(sum(vals) / len(vals), 2) if vals else 0
            aggregates["prague_wtp"].append(avg)

        # New York WTP averages
        for i in range(1, 5):
            col = f"newyork_wtp{i}"
            vals = [safe_float(r[col]) for r in rows if r.get(col)]
            avg = round(sum(vals) / len(vals), 2) if vals else 0
            aggregates["newyork_wtp"].append(avg)

        # Submission table data
        submissions = [{
            "id": r["id"],
            "created_at": r.get("created_at"),
            "age": r.get("age"),
            "gender": r.get("gender"),
            "education": r.get("education"),
            "occupation": r.get("occupation"),
            "income": r.get("income")
        } for r in rows]

        return jsonify({
            "aggregates": aggregates,
            "submissions": submissions
        })

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500


# ================================================
#  API: VIEW INDIVIDUAL RESPONSE
# ================================================
@app.route("/api/admin/response/<int:resp_id>")
def api_admin_response(resp_id):
    try:
        res = supabase.table("survey_responses").select("*").eq("id", resp_id).execute()
        if not res.data:
            return jsonify({"error": "Not found"}), 404
        return jsonify(res.data[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ================================================
#  EXPORT CSV
# ================================================
@app.route("/api/admin/export")
def api_admin_export():
    try:
        res = supabase.table("survey_responses").select("*").execute()
        rows = res.data or []

        output = io.StringIO()
        writer = csv.writer(output)

        if rows:
            headers = list(rows[0].keys())
            writer.writerow(headers)
            for r in rows:
                writer.writerow([r.get(h) for h in headers])
        else:
            writer.writerow(["No data"])

        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment; filename=survey_export.csv"}
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ================================================
#  ROUTES → FRONTEND PAGES
# ================================================
@app.route("/")
def home(): return render_template("index.html")

@app.route("/gallery")
def gallery(): return render_template("gallery.html")

@app.route("/compare")
def compare(): return render_template("compare.html")

@app.route("/survey")
def survey(): return render_template("survey.html")

@app.route("/admin")
def admin(): return render_template("admin.html")


# ================================================
#  STATIC FILES
# ================================================
@app.route("/assets/<path:filename>")
def assets(filename):
    return send_from_directory(os.path.join(PROJECT_DIR, "assets"), filename)


# ================================================
#  RUN SERVER
# ================================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
