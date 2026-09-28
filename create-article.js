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


async function checkAdmin() {

    const { data: { user }, error } =
        await supabaseClient.auth.getUser();

    if (error || !user || user.id !== ADMIN_UID) {

        window.location.href = "admin.html";

        return false;
    }

    return true;
}


function previewArticle() {

    const code = codeBox.value.trim();

    if (!code) {

        preview.srcdoc = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">

                <style>
                    html,
                    body {
                        margin: 0;
                        padding: 0;
                    }

                    body {
                        font-family: Arial, sans-serif;
                        padding: 30px;
                    }
                </style>
            </head>

            <body>
                Paste your article code above to preview it.
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
                    background: #fff;
                }

            </style>

        </head>

        <body>

            ${code}

        </body>

        </html>
    `;
}


async function uploadHeroImage() {

    const file =
        document.getElementById("article-image").files[0];

    if (!file) {
        return null;
    }


    const safeName =
        file.name.replace(/[^a-zA-Z0-9._-]/g, "-");

    const fileName =
        Date.now() + "-" + safeName;


    const { data, error } =
        await supabaseClient.storage
            .from("article-images")
            .upload(fileName, file);


    if (error) {
        throw error;
    }


    return data.path;
}


async function clearExistingPlacement(placement) {

    if (
        placement !== "main-showcase" &&
        placement !== "new-trends"
    ) {
        return;
    }


    const { error } =
        await supabaseClient
            .from("Articles")
            .update({
                homepage_placement: "none"
            })
            .eq("homepage_placement", placement);


    if (error) {
        throw error;
    }
}


async function saveArticle(status) {

    message.textContent = "Saving...";


    const title =
        document.getElementById("article-title").value.trim();


    const standfirst =
        document
            .getElementById("article-standfirst")
            .value
            .trim();


    const category =
        document.getElementById("article-category").value;


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


    const homepagePlacement =
        document
            .getElementById("homepage-placement")
            .value;


    const code =
        codeBox.value.trim();


    if (!title || !slug || !code) {

        message.textContent =
            "Please complete the title, URL and article code.";

        return;
    }


    try {

        if (status === "published") {

            await clearExistingPlacement(
                homepagePlacement
            );
        }


        const imageUrl =
            await uploadHeroImage();


        const { error } =
            await supabaseClient
                .from("Articles")
                .insert({

                    title: title,

                    standfirst: standfirst,

                    content: code,

                    category: category,

                    slug: slug,

                    seo_description: seoDescription,

                    image_url: imageUrl,

                    homepage_placement:
                        homepagePlacement,

                    status: status
                });


        if (error) {
            throw error;
        }


        if (status === "published") {

            message.textContent =
                "Article published successfully.";

        } else {

            message.textContent =
                "Draft saved successfully.";
        }


    } catch (error) {

        console.error(error);

        message.textContent =
            error.message ||
            "Something went wrong.";
    }
}


document
    .getElementById("preview-button")
    .addEventListener(
        "click",
        previewArticle
    );


document
    .querySelector(".save-draft")
    .addEventListener(
        "click",
        function() {
            saveArticle("draft");
        }
    );


document
    .querySelector(".publish-article")
    .addEventListener(
        "click",
        function() {
            saveArticle("published");
        }
    );


checkAdmin();

previewArticle();