/* 统一 API 请求封装 —— 模块负责人：成员 F/G/H/I 共用，请勿各自重复实现 fetch */

const API_BASE = "http://127.0.0.1:8000";

// 请求超时时间：超过 9 秒按超时提示，避免页面一直停在「加载中…」
const REQUEST_TIMEOUT = 9000;

/**
 * 发送请求并统一处理错误。
 * 后端错误格式为 {"detail": "..."}。
 * 超时 / 跨域（file:// 打开）都会转成可读提示，原始错误保留在 error 上便于排查。
 *
 * options.responseType：默认 "json"；传 "blob" 时返回二进制内容（导出 xlsx 用），
 * 该字段不会透传给 fetch。
 */
async function request(path, options = {}) {
    // responseType 只在前端内部使用，不透传给 fetch
    const { responseType = "json", ...init } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const config = { ...init, signal: controller.signal };

    // 只在带请求体（POST/PUT）时声明 JSON，避免 GET/DELETE 触发不必要的 CORS 预检
    if (config.body !== undefined) {
        config.headers = {
            "Content-Type": "application/json",
            ...(config.headers || {}),
        };
    }

    try {
        const response = await fetch(`${API_BASE}${path}`, config);

        if (!response.ok) {
            let message = "请求失败";
            try {
                const error = await response.json();
                if (error && error.detail) {
                    if (typeof error.detail === "string") {
                        message = error.detail;
                    } else if (Array.isArray(error.detail)) {
                        // FastAPI 校验错误的 detail 是数组，取其中可读的 msg
                        message = error.detail
                            .map((item) => (item && item.msg) || JSON.stringify(item))
                            .join("；");
                    } else {
                        message = JSON.stringify(error.detail);
                    }
                }
            } catch (_) {
                // 响应体不是 JSON 时保留默认提示
            }
            throw new Error(message);
        }

        return responseType === "blob" ? response.blob() : response.json();
    } catch (error) {
        if (error && error.name === "AbortError") {
            const timeoutError = new Error("请求超时，请检查后端是否响应缓慢");
            timeoutError.code = "TIMEOUT";
            timeoutError.cause = error;
            throw timeoutError;
        }
        throw error;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * 把请求异常转成用户能看懂的提示。
 * - TypeError：网络层失败，最常见是 file:// 打开被跨域拦截，或后端没启动
 * - TIMEOUT：后端响应过慢
 * - 其他：沿用后端 detail
 */
function describeApiError(error, fallback = "请稍后重试") {
    if (!error) return fallback;
    if (error.code === "TIMEOUT" || error.name === "AbortError") {
        return "请求超时，请检查后端是否响应缓慢";
    }
    if (error.name === "TypeError") {
        return "无法连接后端：如果你是用文件方式打开的页面，请改用 http://localhost:5500/frontend/index.html 访问；并确认后端已在 8000 端口启动";
    }
    return error.message || fallback;
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

    /** 按筛选条件导出 xlsx，返回 Blob（文件名由后端 Content-Disposition 决定，前端自行拼同名） */
    exportRecords(params = {}) {
        return request(`/api/records/export${buildQuery(params)}`, {
            responseType: "blob",
        });
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
