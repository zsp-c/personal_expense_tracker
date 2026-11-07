/* 统一 API 请求封装 —— 模块负责人：成员 F/G/H/I 共用，请勿各自重复实现 fetch */

const API_BASE = "http://127.0.0.1:8000";

/**
 * 发送请求并统一处理错误。
 * 后端错误格式为 {"detail": "..."}。
 */
async function request(path, options = {}) {
    const config = { ...options };

    // 只在带请求体（POST/PUT）时声明 JSON，避免 GET/DELETE 触发不必要的 CORS 预检
    if (config.body !== undefined) {
        config.headers = {
            "Content-Type": "application/json",
            ...(config.headers || {}),
        };
    }

    const response = await fetch(`${API_BASE}${path}`, config);

    if (!response.ok) {
        let message = "请求失败";
        try {
            const error = await response.json();
            if (error && error.detail) {
                message = typeof error.detail === "string"
                    ? error.detail
                    : JSON.stringify(error.detail);
            }
        } catch (_) {
            // 响应体不是 JSON 时保留默认提示
        }
        throw new Error(message);
    }

    return response.json();
}

function buildQuery(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.append(key, value);
        }
    });

    const text = query.toString();
    return text ? `?${text}` : "";
}

const api = {
    getRecords(params = {}) {
        return request(`/api/records/${buildQuery(params)}`);
    },

    getRecord(id) {
        return request(`/api/records/${id}`);
    },

    createRecord(data) {
        return request("/api/records/", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    updateRecord(id, data) {
        return request(`/api/records/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    deleteRecord(id) {
        return request(`/api/records/${id}`, {
            method: "DELETE",
        });
    },

    getSummary(params = {}) {
        return request(`/api/stats/summary${buildQuery(params)}`);
    },

    getCategoryTotals(params = {}) {
        return request(`/api/stats/category${buildQuery(params)}`);
    },
};

/** 元 -> 分：提交前调用。 */
function yuanToFen(value) {
    return Math.round(Number(value) * 100);
}

/** 分 -> 元：展示前调用，固定两位小数。 */
function fenToYuan(value) {
    return (Number(value) / 100).toFixed(2);
}
