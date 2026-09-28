const SUPABASE_URL = "https://ghnjdfmnsmoiqdilsxzn.supabase.co";
const SUPABASE_KEY = "sb_publishable_bh-ZnMGseMcTzemZMq8QVQ_5mEXim9w";
const ADMIN_UID = "02a09814-bc5a-4b56-81f6-6033176a243f";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const codeBox = document.getElementById("article-code");
const preview = document.getElementById("article-preview");
const message = document.getElementById("article-message");

let articleId = null;


// ==============================
// CHECK ADMIN
// ==============================

async function checkAdmin() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (
        error ||
        !user ||
        user.id !== ADMIN_UID
    ) {
        window.location.href = "admin.html";
        return false;
    }

    return true;
}


// ==============================
// ARTICLE PREVIEW
// ==============================

function previewArticle() {

    const code = codeBox.value.trim();

    if (!code) {

        preview.srcdoc = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
            </head>

            <body style="
                margin:0;
                padding:30px;
                font-family:Arial,sans-serif;
            ">

                Your article code will appear here.

            </body>
            </html>
        `;

        return;
    }


    preview.srcdoc = `
        <!DOCTYPE html>

        <html lang="en">

        <head>

            <meta charset="UTF-8">

            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >

            <style>

                html,
                body {
                    margin: 0;
                    padding: 0;
                    background: #ffffff;
                }

            </style>

        </head>

        <body>

            ${code}

        </body>

        </html>
    `;
}


// ==============================
// LOAD EXISTING ARTICLE
// ==============================

async function loadArticle() {

    const params =
        new URLSearchParams(window.location.search);

    const id = params.get("id");

    articleId = id;


    if (!id) {

        message.textContent =
            "No article selected.";

        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("Articles")
        .select("*")
        .eq("id", id)
        .single();


    if (error || !data) {

        console.error(error);

        message.textContent =
            "Could not load article.";

        return;
    }


    // TITLE

    document.getElementById(
        "article-title"
    ).value = data.title || "";


    // STANDFIRST

    document.getElementById(
        "article-standfirst"
    ).value = data.standfirst || "";


    // CATEGORY

    document.getElementById(
        "article-category"
    ).value =
        data.category || "fashion-news";


    // SLUG

    document.getElementById(
        "article-slug"
    ).value = data.slug || "";


    // SEO DESCRIPTION

    document.getElementById(
        "article-description"
    ).value =
        data.seo_description || "";


    // STATUS

    document.getElementById(
        "article-status"
    ).value =
        data.status || "draft";


    // HOMEPAGE PLACEMENT

    document.getElementById(
        "homepage-placement"
    ).value =
        data.homepage_placement || "none";


    // ARTICLE CODE

    codeBox.value =
        data.content || "";


    // SHOW PREVIEW

    previewArticle();
}


// ==============================
// UPLOAD HERO IMAGE
// ==============================

async function uploadHeroImage() {

    const file =
        document.getElementById(
            "article-image"
        ).files[0];


    if (!file) {
        return null;
    }


    const safeName =
        file.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "-"
        );


    const fileName =
        Date.now() + "-" + safeName;


    const {
        data,
        error
    } = await supabaseClient
        .storage
        .from("article-images")
        .upload(
            fileName,
            file
        );


    if (error) {
        throw error;
    }


    return data.path;
}


// ==============================
// CLEAR OLD HOMEPAGE PLACEMENT
// ==============================

async function clearExistingPlacement(
    placement
) {

    if (
        placement !== "main-showcase" &&
        placement !== "new-trends"
    ) {
        return;
    }


    const {
        error
    } = await supabaseClient
        .from("Articles")
        .update({
            homepage_placement: "none"
        })
        .eq(
            "homepage_placement",
            placement
        )
        .neq(
            "id",
            articleId
        );


    if (error) {
        throw error;
    }
}


// ==============================
// SAVE CHANGES
// ==============================

async function saveChanges() {

    if (!articleId) {

        message.textContent =
            "No article selected.";

        return;
    }


    message.textContent =
        "Saving...";


    // GET FORM VALUES

    const title =
        document
            .getElementById("article-title")
            .value
            .trim();


    const standfirst =
        document
            .getElementById("article-standfirst")
            .value
            .trim();


    const category =
        document
            .getElementById("article-category")
            .value;


    const slug =
        document
            .getElementById("article-slug")
            .value
            .trim();


    const seoDescription =
        document
            .getElementById("article-description")
            .value
            .trim();


    const status =
        document
            .getElementById("article-status")
            .value;


    const homepagePlacement =
        document
            .getElementById("homepage-placement")
            .value;


    const code =
        codeBox.value.trim();


    // CHECK REQUIRED FIELDS

    if (
        !title ||
        !slug ||
        !code
    ) {

        message.textContent =
            "Please complete the title, URL and article code.";

        return;
    }


    try {

        // If this article is being
        // featured on the homepage,
        // remove that placement
        // from any other article.

        if (
            status === "published" &&
            homepagePlacement !== "none"
        ) {

            await clearExistingPlacement(
                homepagePlacement
            );
        }


        // BASIC ARTICLE DATA

        const updates = {

            title: title,

            standfirst: standfirst,

            content: code,

            category: category,

            slug: slug,

            seo_description:
                seoDescription,

            status: status,

            homepage_placement:
                homepagePlacement

        };


        // HERO IMAGE

        const imageUrl =
            await uploadHeroImage();


        if (imageUrl) {

            updates.image_url =
                imageUrl;
        }


        // UPDATE ARTICLE

        const {
            error
        } = await supabaseClient
            .from("Articles")
            .update(updates)
            .eq(
                "id",
                articleId
            );


        if (error) {
            throw error;
        }


        // SUCCESS

        message.textContent =
            "Article updated successfully.";


        // REFRESH PREVIEW

        previewArticle();


    } catch (error) {

        console.error(error);

        message.textContent =
            error.message ||
            "Something went wrong.";
    }
}


// ==============================
// BUTTONS
// ==============================

document
    .getElementById(
        "preview-button"
    )
    .addEventListener(
        "click",
        previewArticle
    );


document
    .getElementById(
        "save-changes"
    )
    .addEventListener(
        "click",
        saveChanges
    );


// ==============================
// START
// ==============================

(async function start() {

    const isAdmin =
        await checkAdmin();


    if (isAdmin) {

        await loadArticle();
    }

})();