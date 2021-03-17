const ERROR_CODE = {
    GENERAL: -1,
    OCR: {
        FAILED: -102,
        RESOURCE_NOT_FOUND: -103,
        FAILED_GETTING_FILE_SIZE: -104,
        FAILED_SAVING_IMAGE_DATA: -105,
        IMAGE_NOT_PROVIDED: -106,
        LANG_MUST_BE_3: -107,
        IMG_EXT_NOT_SUPPORTED: -108,
        IMG_EXT_IS_NULL: -108,
    },
    USER: {
        INVALID_NAME: -200,
        INVALID_EMAIL: -201,
        INVALID_TOKEN: -202,
        EMAIL_ALREADY_REGISTERED: -203,
        DB_ERROR_USER_CREATE_FAILED: -204,
        DB_ERROR_USER_NOT_FOUND: -205,
        DB_ERROR_EXCEPTION: -206,
        UNAUTHORIZED: -207,
    },
    APP: {
        INVALID_TOKEN: -300,
        INVALID_NAME: -301,
        ALREADY_EXISTS: -302,
        DB_ERROR_APP_NOT_FOUND: -303,
        REGISTER_FAILED: -304,
        ERROR: -305,
    },
    APP_AUTH: {
        NO_TOKEN: -400,
        UNAUTHORIZED_TOKEN: -401,
        APP_DISABLED: -402,
        APP_NOT_FOUND: -403,
        DB_ERROR: -404,
    },
    USER_AUTH: {
        NO_TOKEN: -500,
        UNAUTHORIZED_TOKEN: -501,
        USER_DISABLED: -502,
        USER_NOT_FOUND: -503,
        DB_ERROR: -504,
    },
    ADMIN: {
        INVALID_TOKEN: -600,
        INVALID_EMAIL: -601,
        DB_ERROR_USER_NOT_FOUND: -602,
        ERROR_TOGGLE_USER_STATUS: -603,
    },
    LOG: {
        INVALID_TOKEN: -700,
    }
}

module.exports = ERROR_CODE;