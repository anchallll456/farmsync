const http = require("http");
const { URL } = require("url");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 5000;

const db = {
    farmers: [],
    buyers: []
};

const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end(JSON.stringify(payload));
}

function sendFile(res, filePath, contentType = "text/html; charset=utf-8") {
    fs.readFile(filePath, (error, data) => {
        if (error) {
            return sendJson(res, 404, { message: "File not found." });
        }

        res.writeHead(200, {
            "Content-Type": contentType
        });
        res.end(data);
    });
}

function parseJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk;
            if (body.length > 1e6) {
                reject(new Error("Request body too large."));
                req.destroy();
            }
        });

        req.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(new Error("Invalid JSON payload."));
            }
        });

        req.on("error", () => {
            reject(new Error("Unable to read request body."));
        });
    });
}

function validateCommonFields(body) {
    if (!body.fullName || body.fullName.trim().length < 2) {
        return "Full name is required.";
    }
    if (!body.phone || !phoneRegex.test(body.phone.trim())) {
        return "A valid phone number is required.";
    }
    if (!body.password || !strongPasswordRegex.test(body.password)) {
        return "Password must be strong (8+ chars with upper/lowercase, number, symbol).";
    }
    return null;
}

function registerFarmer(body) {
    const commonError = validateCommonFields(body);
    if (commonError) return commonError;

    if (!body.farmName || body.farmName.trim().length < 2) {
        return "Farm name is required.";
    }
    if (!body.location || body.location.trim().length < 3) {
        return "Location is required.";
    }
    if (!body.primaryProduce || body.primaryProduce.trim().length === 0) {
        return "Primary produce is required.";
    }

    const duplicate = db.farmers.find((f) => f.phone === body.phone.trim());
    if (duplicate) return "Farmer account already exists with this phone number.";

    db.farmers.push({
        id: db.farmers.length + 1,
        role: "farmer",
        fullName: body.fullName.trim(),
        phone: body.phone.trim(),
        farmName: body.farmName.trim(),
        location: body.location.trim(),
        primaryProduce: body.primaryProduce.trim(),
        createdAt: new Date().toISOString()
    });

    return null;
}

function registerBuyer(body) {
    const commonError = validateCommonFields(body);
    if (commonError) return commonError;

    if (!body.email || !emailRegex.test(body.email.trim())) {
        return "A valid email is required.";
    }
    if (!body.buyingPreference || body.buyingPreference.trim().length === 0) {
        return "Buying preference is required.";
    }

    const duplicateEmail = db.buyers.find((b) => b.email === body.email.trim().toLowerCase());
    if (duplicateEmail) return "Buyer account already exists with this email.";

    db.buyers.push({
        id: db.buyers.length + 1,
        role: "buyer",
        fullName: body.fullName.trim(),
        phone: body.phone.trim(),
        email: body.email.trim().toLowerCase(),
        businessName: (body.businessName || "").trim(),
        buyingPreference: body.buyingPreference.trim(),
        productInterests: (body.productInterests || "").trim(),
        createdAt: new Date().toISOString()
    });

    return null;
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const baseDir = __dirname;

    if (req.method === "OPTIONS") {
        return sendJson(res, 204, {});
    }

    if (req.method === "POST" && url.pathname === "/api/register/farmer") {
        try {
            const body = await parseJsonBody(req);
            const error = registerFarmer(body);
            if (error) {
                return sendJson(res, 400, { message: error });
            }

            return sendJson(res, 201, { message: "Farmer registration successful." });
        } catch (error) {
            return sendJson(res, 400, { message: error.message || "Invalid request." });
        }
    }

    if (req.method === "POST" && url.pathname === "/api/register/buyer") {
        try {
            const body = await parseJsonBody(req);
            const error = registerBuyer(body);
            if (error) {
                return sendJson(res, 400, { message: error });
            }

            return sendJson(res, 201, { message: "Buyer registration successful." });
        } catch (error) {
            return sendJson(res, 400, { message: error.message || "Invalid request." });
        }
    }

    if (req.method === "GET" && url.pathname === "/api/health") {
        return sendJson(res, 200, { status: "ok", farmers: db.farmers.length, buyers: db.buyers.length });
    }

    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
        return sendFile(res, path.join(baseDir, "index.html"));
    }

    if (req.method === "GET" && url.pathname === "/login.html") {
        return sendFile(res, path.join(baseDir, "login.html"));
    }

    if (req.method === "GET" && url.pathname === "/register.html") {
        return sendFile(res, path.join(baseDir, "register.html"));
    }

    if (req.method === "GET" && url.pathname === "/login.js") {
        return sendFile(res, path.join(baseDir, "login.js"), "application/javascript; charset=utf-8");
    }

    if (req.method === "GET" && url.pathname === "/register.js") {
        return sendFile(res, path.join(baseDir, "register.js"), "application/javascript; charset=utf-8");
    }

    return sendJson(res, 404, { message: "Route not found." });
});

server.listen(PORT, () => {
    console.log(`FarmSync API running at http://localhost:${PORT}`);
});