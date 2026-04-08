const https = require('https');

const CMDS = [
    { sci: 'Panthera leo', desc: 'Mammal (expecting Class Mammalia, Phylum Chordata)' },
    { sci: 'Passer domesticus', desc: 'Bird (expecting Class Aves, Phylum Chordata)' }
];

// QIDs de rangos taxonómicos en Wikidata (copiado de TaxoGuessr.tsx)
const rankMap = {
    'Q34740': 'genus',
    'Q7432': 'species',
    'Q35409': 'family',
    'Q36602': 'order',
    'Q37517': 'class',
    'Q38348': 'phylum'
};

const ranksReverse = Object.entries(rankMap).reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {});

async function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'TaxoGuessrDebug/1.0' } }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', reject);
    });
}

async function debugSpecies(scientificName) {
    console.log(`\n=== DEBUGGING: ${scientificName} ===`);

    // 1. Search
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(scientificName)}&language=es&format=json&origin=*`;
    const searchData = await fetchJson(searchUrl);

    if (!searchData?.search?.length) {
        console.log('Search failed');
        return;
    }

    const qid = searchData.search[0].id;
    console.log(`Found QID: ${qid}`);

    // Traversal
    let currentQid = qid;
    const visited = new Set([currentQid]);
    let iterations = 0;
    const taxonomy = {};

    while (currentQid && iterations < 30) { // increased to 30 just in case
        iterations++;
        process.stdout.write(`Step ${iterations}: Checking ${currentQid}... `);

        try {
            const taxonUrl = `https://www.wikidata.org/wiki/Special:EntityData/${currentQid}.json`;
            const data = await fetchJson(taxonUrl);
            const entity = data.entities[currentQid];

            if (!entity) {
                console.log('Entity not found in response');
                break;
            }

            // check rank P105
            const rankClaim = entity.claims?.P105?.[0];
            const rankQid = rankClaim?.mainsnak?.datavalue?.value?.id;
            const rankName = rankMap[rankQid];

            const label = entity.labels?.en?.value || entity.labels?.es?.value || currentQid;
            console.log(`[${label}] RankQID: ${rankQid || 'NONE'} (${rankName || 'unknown'})`);

            if (rankName) {
                taxonomy[rankName] = label;
                console.log(`   -> MATCH! Found ${rankName}: ${label}`);
            }

            // check parent P171
            const parentClaim = entity.claims?.P171?.[0];
            const parentQid = parentClaim?.mainsnak?.datavalue?.value?.id;

            if (!parentQid) {
                console.log('   -> No P171 parent found. Stopping.');
                break;
            }

            if (visited.has(parentQid)) {
                console.log(`   -> Loop detected (${parentQid}). Stopping.`);
                break;
            }

            visited.add(parentQid);
            currentQid = parentQid;

        } catch (e) {
            console.log('Error:', e.message);
            break;
        }
    }

    console.log('Final Taxonomy:', taxonomy);
}

// Run
(async () => {
    for (const item of CMDS) {
        await debugSpecies(item.sci);
    }
})();
