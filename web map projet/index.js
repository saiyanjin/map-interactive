var itineraire;
document.addEventListener("DOMContentLoaded", function () {
    var maCarte = L.map('maCarte').setView([46.603354, 1.888334], 2);
    var markersCluster = L.markerClusterGroup();
    var geojson;
    var markersFromDatabase = [];
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(maCarte);
    

    document.getElementById('iti').addEventListener('submit', async function (event) {
        event.preventDefault(); // Empêche le formulaire de se soumettre normalement
    
        var nomAdresse = document.getElementById("nomadresse").value;
        var nomFestival = document.getElementById("nomFestival").value;
    
        try {
            // Convertir l'adresse en coordonnées
            var coordonneesAdresse = await convertirAdresseEnCoordonneesAsync(nomAdresse);
            console.log('Coordonnées de l\'adresse :', coordonneesAdresse);
    
            // Obtenir les coordonnées du festival
            var coordonneesFestival = await obtenirCoordonneesFestivalAsync(nomFestival);
            console.log('Coordonnées du festival :', coordonneesFestival);
    
            // Supprimer l'ancien itinéraire s'il existe
            if (itineraire) {
                maCarte.removeControl(itineraire);
            }
    
            // Créer et ajouter le nouvel itinéraire
            itineraire = L.Routing.control({
                waypoints: [
                    L.latLng(coordonneesAdresse.lat, coordonneesAdresse.lng),
                    L.latLng(coordonneesFestival[0], coordonneesFestival[1])
                ],
            }).addTo(maCarte);
        } catch (erreur) {
            console.error('Erreur :', erreur);
        }
    });
    document.getElementById('btnItineraireFini').addEventListener('click', function () {
        // Vérifier si l'itinéraire existe
        if (itineraire) {
            // Supprimer l'itinéraire de la carte
            maCarte.removeControl(itineraire);
            // Réinitialiser la variable itineraire à null
            itineraire = null;
        } else {
            console.warn('Aucun itinéraire en cours.');
        }
    });

// Fonction pour convertir l'adresse en coordonnées avec une Promise
function convertirAdresseEnCoordonneesAsync(adresse) {
    return new Promise((resolve, reject) => {
        convertirAdresseEnCoordonnees(adresse, (erreur, coordonnees) => {
            if (!erreur) {
                resolve(coordonnees);
            } else {
                reject(erreur);
            }
        });
    });
}

// Fonction pour obtenir les coordonnées du festival avec une Promise
function obtenirCoordonneesFestivalAsync(nomFestival) {
    return new Promise((resolve, reject) => {
        obtenirCoordonneesFestival(nomFestival, (erreur, coordonnees) => {
            if (!erreur) {
                resolve(coordonnees);
            } else {
                reject(erreur);
            }
        });
    });
}

    
    

    // Charger le GeoJSON et créer la carte avec les marqueurs
    fetch('festivals-global-festivals-_-pl.geojson')
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            geojson = data;

            L.geoJSON(geojson, {
                onEachFeature: function (feature, layer) {
                    var popupContent = `
                        <b>${feature.properties.nom_du_festival}</b><br>
                        <b>Période principale :</b> ${feature.properties.periode_principale_de_deroulement_du_festival}<br>
                        <b>Code postal :</b> ${feature.properties.code_postal_de_la_commune_principale_de_deroulement}<br>
                        <b>Site Internet :</b> <a href="${feature.properties.site_internet_du_festival}" target="_blank">${feature.properties.site_internet_du_festival}</a>`;
                    layer.bindPopup(popupContent);
                }
            }).addTo(markersCluster);
        })
        .catch(function (error) {
            console.error('Erreur lors du chargement du GeoJSON :', error);
        });

    // Charger les marqueurs de la base de données et les ajouter au groupe de clusters
    fetch('getPoints.php')
    .then(response => response.json())
    .then(data => {
        markersFromDatabase = data;
        markersFromDatabase.forEach(point => {
            // Utiliser Leaflet pour créer des marqueurs
            var marker = L.marker([parseFloat(point.latitude), parseFloat(point.longitude)])
                .bindPopup(point.nom);
            markersCluster.addLayer(marker);
        });

        // Ajouter le groupe de marqueurs à la carte
        markersCluster.addTo(maCarte);
    })
    .catch(error => console.error('Erreur lors de la récupération des données:', error));

    // Gérer la recherche à chaque modification de la barre de saisie
    document.getElementById('barreDeSaisie').addEventListener('input', function () {
        rechercherFestival(this.value);
    });

    function rechercherFestival(nomFestival) {
        markersCluster.clearLayers(); // Effacer tous les marqueurs existants du groupe
    
        // Rechercher dans les marqueurs de la base de données
        markersFromDatabase.forEach(function (feature) {
            if (feature.latitude && feature.longitude) {
                var nomLowerCase = feature.nom.toLowerCase();
                if (nomLowerCase.includes(nomFestival.toLowerCase()) || nomFestival.trim() === "") {
                    var popupContent = `<b>${feature.nom}</b><br><b>Adresse :</b> ${feature.adresse}`;
                    var marker = L.marker([parseFloat(feature.latitude), parseFloat(feature.longitude)])
                        .bindPopup(popupContent);
                    markersCluster.addLayer(marker);
                }
            }
        });
    
        // Rechercher dans les marqueurs du GeoJSON
        geojson.features.forEach(function (feature) {
            if (feature.geometry && feature.geometry.coordinates) {  // Ajout de la vérification
                var nomLowerCase = feature.properties.nom_du_festival.toLowerCase();
                if (nomLowerCase.includes(nomFestival.toLowerCase()) || nomFestival.trim() === "") {
                    var popupContent = `
                        <b>${feature.properties.nom_du_festival}</b><br>
                        <b>Période principale :</b> ${feature.properties.periode_principale_de_deroulement_du_festival}<br>
                        <b>Code postal :</b> ${feature.properties.code_postal_de_la_commune_principale_de_deroulement}<br>
                        <b>Site Internet :</b> <a href="${feature.properties.site_internet_du_festival}" target="_blank">${feature.properties.site_internet_du_festival}</a>`;
                    var marker = L.marker(feature.geometry.coordinates.slice().reverse())
                        .bindPopup(popupContent);
                    markersCluster.addLayer(marker);
                }
            }
        });
    
        // Ajouter le groupe de marqueurs à la carte à la fin
        maCarte.addLayer(markersCluster);
    }
    function convertirAdresseEnCoordonnees(adresse, callback) {
        // Remplacez 'VOTRE_CLE_API' par votre clé API Google Maps
        var apiKey = 'AIzaSyB9qz5KaB2XxmUfmilsdtvBAI2V0tEft9U';
        var adresseEncodee = encodeURIComponent(adresse);
    
        // Construire l'URL de l'API Geocoding
        var url = `https://maps.googleapis.com/maps/api/geocode/json?address=${adresseEncodee}&key=${apiKey}`;
    
        // Effectuer une requête AJAX pour récupérer les données
        fetch(url)
            .then(response => response.json())
            .then(data => {
                // Vérifier si la réponse contient des résultats
                if (data.status === 'OK' && data.results.length > 0) {
                    var resultat = data.results[0];
                    var coordonnees = resultat.geometry.location;
                    callback(null, coordonnees);
                } else {
                    callback('Aucun résultat trouvé pour cette adresse.');
                }
            })
            .catch(error => {
                callback('Erreur lors de la requête vers l\'API Geocoding.');
            });
    }

    function obtenirCoordonneesFestival(nomFestival, callback) {
        // Recherche dans le GeoJSON
        var coordonneesGeoJSON = rechercherCoordonneesDansGeoJSON(nomFestival);
        if (coordonneesGeoJSON) {
            callback(null, coordonneesGeoJSON);
        } else {
            // Recherche dans la base de données via getPoints.php
            fetch('getPoints.php')
                .then(response => response.json())
                .then(data => {
                    var coordonneesDatabase = rechercherCoordonneesDansDatabase(nomFestival, data);
                    if (coordonneesDatabase) {
                        callback(null, coordonneesDatabase);
                    } else {
                        callback('Festival non trouvé');
                    }
                })
                .catch(error => callback('Erreur lors de la récupération des données: ' + error));
        }
    }
    
    function rechercherCoordonneesDansGeoJSON(nomFestival) {
        var coordonnees = null;
        // Rechercher dans les marqueurs du GeoJSON
        geojson.features.forEach(function (feature) {
            var nomLowerCase = feature.properties.nom_du_festival.toLowerCase();
            if (nomLowerCase === nomFestival.toLowerCase()) {
                coordonnees = feature.geometry.coordinates.slice().reverse();
            }
        });
        return coordonnees;
    }
    
    function rechercherCoordonneesDansDatabase(nomFestival, data) {
        var coordonnees = null;
        data.forEach(function (point) {
            var nomLowerCase = point.nom.toLowerCase();
            if (nomLowerCase === nomFestival.toLowerCase() && point.latitude && point.longitude) {
                coordonnees = [parseFloat(point.latitude), parseFloat(point.longitude)];
            }
        });
        return coordonnees;
    }
    document.getElementById('main-search-button').addEventListener('click', async function () {
        var nomFestival = document.getElementById("barreDeSaisie").value;
    
        try {
            // Obtenez les coordonnées du festival
            var coordonneesFestival = await obtenirCoordonneesFestivalAsync(nomFestival);
    
            // Vérifiez si les coordonnées existent
            if (coordonneesFestival) {
                // Centrez la carte sur les coordonnées du festival avec un zoom spécifique (par exemple, 12)
                maCarte.flyTo(coordonneesFestival, 12);
            } else {
                console.warn('Coordonnées du festival non trouvées.');
            }
        } catch (erreur) {
            console.error('Erreur :', erreur);
        }
    });
    // Créez une barre de saisie pour l'itinéraire dans votre HTML
var adresseInput = document.getElementById('nomadresse');

document.getElementById('geolocButton').addEventListener('click', function () {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var userLat = position.coords.latitude;
            var userLng = position.coords.longitude;

            // Utiliser le service de géocodage inversé pour obtenir l'adresse
            var geocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}&zoom=18&addressdetails=1`;

            fetch(geocodeUrl)
                .then(response => response.json())
                .then(data => {
                    var address = data.display_name;

                    // Afficher l'adresse dans la barre de saisie
                    adresseInput.value = address;

                    maCarte.eachLayer(function (layer) {
                        if (layer instanceof L.Marker) {
                            layer.remove();
                        }
                    });
                    maCarte.setView([userLat, userLng], 15);

                    // Ajouter un marqueur avec une popup indiquant "Vous" et l'adresse
                    var userMarker = L.marker([userLat, userLng]).addTo(maCarte).bindPopup(`Vous<br>${address}`).openPopup();

                    // Ajouter un écouteur d'événements pour le moment où la popup est fermée
                    userMarker.on('popupclose', function () {
                        // Supprimer le marqueur lorsque la popup est fermée
                        maCarte.removeLayer(userMarker);
                    });

                    // Ajouter un écouteur d'événements pour le clic sur le marqueur
                    userMarker.on('click', function () {
                        // Mettre à jour la barre de saisie d'itinéraire avec l'adresse
                        adresseInput.value = address;
                    });
                })
                .catch(error => {
                    console.error('Erreur de géocodage inversé : ', error.message);
                    alert('Erreur lors de la récupération de l\'adresse.');
                });
        }, function (error) {
            console.error('Erreur de géolocalisation : ', error.message);
            alert('La géolocalisation a échoué. Veuillez autoriser la géolocalisation dans les paramètres de votre navigateur.');
        });
    } else {
        alert('La géolocalisation n\'est pas prise en charge par votre navigateur.');
    }
});

    
});