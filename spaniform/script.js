document.addEventListener("DOMContentLoaded", async () => {
    const ccaaSelect = document.getElementById("ccaa");
    const provinciaSelect = document.getElementById("provincia");
    const poblacionSelect = document.getElementById("poblacion");
    const submitButton = document.getElementById("submit");
    const imageContainer = document.getElementById("image-container");
    const locationText = document.getElementById("location");
    const descriptionText = document.getElementById("description-text");

    // Load Autonomous Communities (CCAA)
    async function loadCCAA() {
        try {
            const response = await fetch("https://raw.githubusercontent.com/frontid/ComunidadesProvinciasPoblaciones/refs/heads/master/ccaa.json");
            const ccaaList = await response.json();

            ccaaList.forEach(ccaa => {
                let option = document.createElement("option");
                option.value = ccaa.code;
                option.textContent = ccaa.label;
                ccaaSelect.appendChild(option);
            });

        } catch (error) {
            console.error("Error loading CCAA:", error);
        }
    }

    // Load Provinces when a CCAA is selected
    async function loadProvincias(ccaaId) {
        provinciaSelect.innerHTML = '<option value="" disabled selected>Selecciona una opción</option>';
        poblacionSelect.innerHTML = '<option value="" disabled selected>Selecciona una opción</option>';
        provinciaSelect.disabled = true;
        poblacionSelect.disabled = true;

        try {
            const response = await fetch("https://raw.githubusercontent.com/frontid/ComunidadesProvinciasPoblaciones/refs/heads/master/provincias.json");
            const provinciaList = await response.json();

            let filteredProvincias = provinciaList.filter(provincia => provincia.parent_code === ccaaId);
            if (filteredProvincias.length > 0) provinciaSelect.disabled = false;

            filteredProvincias.forEach(provincia => {
                let option = document.createElement("option");
                option.value = provincia.code;
                option.textContent = provincia.label;
                provinciaSelect.appendChild(option);
            });

        } catch (error) {
            console.error("Error loading provinces:", error);
        }
    }

    // Load Towns when a Province is selected
    async function loadPoblaciones(provinciaId) {
        poblacionSelect.innerHTML = '<option value="" disabled selected>Selecciona una opción</option>';
        poblacionSelect.disabled = true;

        try {
            const response = await fetch("https://raw.githubusercontent.com/frontid/ComunidadesProvinciasPoblaciones/refs/heads/master/poblaciones.json");
            const poblacionList = await response.json();

            let filteredPoblaciones = poblacionList.filter(poblacion => String(poblacion.parent_code) === String(provinciaId));
            
            if (filteredPoblaciones.length > 0) {
                poblacionSelect.disabled = false;
            }

            filteredPoblaciones.forEach(poblacion => {
                let option = document.createElement("option");
                option.value = poblacion.label;
                option.textContent = poblacion.label;
                poblacionSelect.appendChild(option);
            });

        } catch (error) {
            console.error("Error loading towns:", error);
        }
    }

    // Fetch description of the selected town
    async function fetchDescription(poblacion) {
        try {
            const response = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(poblacion)}`);
            const data = await response.json();

            if (data.extract) {
                descriptionText.textContent = data.extract;
            } else {
                descriptionText.textContent = "No description available for this town.";
            }
        } catch (error) {
            console.error("Error fetching description:", error);
            descriptionText.textContent = "Failed to load description.";
        }
    }

    // Fetch location coordinates of the selected town
    async function fetchLocation(poblacion) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(poblacion + ', España')}`);
            const data = await response.json();

            if (data.length > 0) {
                const lat = data[0].lat;
                const lon = data[0].lon;
                locationText.textContent = `Latitud: ${lat}, Longitud: ${lon}`;
            } else {
                locationText.textContent = "Location not found.";
            }
        } catch (error) {
            console.error("Error fetching location:", error);
            locationText.textContent = "Failed to load location.";
        }
    }

    // Fetch Images from Wikimedia
    async function fetchImages(poblacion) {
        imageContainer.innerHTML = "<p>Loading images...</p>";

        try {
            const response = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=images&titles=${encodeURIComponent(poblacion)}&gimlimit=10&prop=imageinfo&iiprop=url`);
            const data = await response.json();

            imageContainer.innerHTML = "";
            if (data.query && data.query.pages) {
                Object.values(data.query.pages).forEach(page => {
                    if (page.imageinfo) {
                        let img = document.createElement("img");
                        img.src = page.imageinfo[0].url;
                        img.alt = poblacion;
                        img.style.width = "400px";
                        img.style.margin = "10px";
                        imageContainer.appendChild(img);
                    }
                });
            } else {
                imageContainer.innerHTML = "<p>No images found for this town.</p>";
            }
        } catch (error) {
            console.error("Error fetching images:", error);
            imageContainer.innerHTML = "<p>Failed to load images.</p>";
        }
    }

    // Event Listeners
    ccaaSelect.addEventListener("change", () => loadProvincias(ccaaSelect.value));
    provinciaSelect.addEventListener("change", () => loadPoblaciones(provinciaSelect.value));

    submitButton.addEventListener("click", (event) => {
        event.preventDefault(); // Prevent form submission
        const poblacion = poblacionSelect.value;
        if (poblacion) {
            fetchImages(poblacion);
            fetchLocation(poblacion);
            fetchDescription(poblacion);
        } else {
            alert("Please select a town.");
        }
    });

    // Initialize the form
    loadCCAA();
});
