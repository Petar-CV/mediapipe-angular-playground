// @ts-nocheck
const EVALUATION_URL = '/assets/HandPhotosDataset'
const METADATA = 'metadata.json'

let metadata = {};
let images: HTMLImageElement[] = [];
function loadData() {
    return new Promise((resolve, reject) => {
            // fetch all
        fetch(EVALUATION_URL + '/' + METADATA)
            .then(response => response.json())
            .then(json => {
                metadata = json;
                // iterate over keys of metadata
                // each key is an image filename
                for (let key in metadata) {
                    // load image
                    let img = new Image();
                    img.src = EVALUATION_URL + '/' + key;
                    img.onload = () => {
                        // add image to images array
                        images.push(img);
                        // if all images are loaded
                        if (images.length == Object.keys(metadata).length) {
                            // start evaluation
                            resolve(metadata);
                        }
                    }

                    img.onerror = () => {
                        reject();
                    }
                }
            })
            .catch(reject)
    });
}

export function evaluate(predict: any) {
    loadData().then(() => {
        images.forEach((img, index) => {
            // get prediction
            predict(img).then((prediction: any) => {
                // get label from metadata
                // tslint:disable-next-line
                let label = Object.keys(metadata)[index];
                let imageData = metadata[Object.keys(metadata)[index]];
                
                // log prediction and label
                console.log('Prediction: ' + prediction + ' Label: ' + label);
            });
        });
    }).catch(() => {
        console.log('Error loading data');
    });
}