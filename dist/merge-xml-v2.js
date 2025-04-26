"use strict";
// import * as fs from "fs";
// import { parseStringPromise, Builder } from "xml2js";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// async function readXML(filePath: string) {
//   const data = await fs.promises.readFile(filePath, "utf-8");
//   return await parseStringPromise(data);
// }
// async function mergeXMLFiles() {
//   try {
//     const [
//       artistsData,
//       albumsData,
//       djData,
//       groupData,
//       singerData,
//       catalogData,
//       rentData,
//       clientsData,
//     ] = await Promise.all([
//       readXML("dataXml/Artists.xml"),
//       readXML("dataXml/Albums.xml"),
//       readXML("dataXml/DJ.xml"),
//       readXML("dataXml/Groups.xml"),
//       readXML("dataXml/Singers.xml"),
//       readXML("dataXml/CatalogCD.xml"),
//       readXML("dataXml/Rent.xml"),
//       readXML("dataXml/Clients.xml"),
//     ]);
//     const system: any = {
//       System: {
//         Artists: [],
//         Clients: [],
//       },
//     };
//     for (const artist of artistsData.ARTISTS.ARTIST) {
//       const artistId = artist.$.id;
//       const newArtist: any = {
//         id: artistId,
//         Name: artist.NAME[0],
//         Country: artist.COUNTRY[0],
//         Genres: artist.GENRE,
//         Type: {},
//         Albums: [],
//       };
//       const dj = djData.DJS?.DJ?.find((d: any) => d.$.id === artistId);
//       const group = groupData.GROUPS?.GROUP?.find(
//         (g: any) => g.$.id === artistId
//       );
//       const singer = singerData.SINGERS?.SINGER?.find(
//         (s: any) => s.$.id === artistId
//       );
//       if (dj) {
//         newArtist.Type = { DJ: dj };
//       } else if (group) {
//         newArtist.Type = { Group: group };
//       } else if (singer) {
//         newArtist.Type = { Singer: singer };
//       }
//       const artistAlbums = albumsData.ALBUMS.ALBUM.filter(
//         (album: any) => album.$.ARTIST_ID === artistId
//       );
//       for (const album of artistAlbums) {
//         const newAlbum: any = {
//           id: album.$.id,
//           Name: album.Name[0],
//           ReleaseYear: album.ReleaseYear[0],
//           Price: album.Price[0],
//           CatalogCDs: [],
//         };
//         const albumCDs = catalogData.CATALOG.CD.filter(
//           (cd: any) => cd.AlbumID[0] === album.$.id
//         );
//         for (const cd of albumCDs) {
//           const newCD: any = {
//             id: cd.$.id,
//             Occupied: cd.Occupied[0],
//             State: cd.State[0],
//             Rents: [],
//           };
//           const cdRents = rentData.RENTS.RENT.filter(
//             (rent: any) => rent.CDID[0] === cd.$.id
//           );
//           for (const rent of cdRents) {
//             newCD.Rents.push({
//               ClientID: rent.ClientID[0],
//               FromDate: rent.FromDate[0],
//               ReturnDate: rent.ReturnDate[0],
//               ReturnState: rent.ReturnState[0],
//             });
//           }
//           newAlbum.CatalogCDs.push(newCD);
//         }
//         newArtist.Albums.push(newAlbum);
//       }
//       system.System.Artists.push(newArtist);
//     }
//     for (const client of clientsData.CLIENTS.CLIENT) {
//       const newClient = {
//         id: client.$.id,
//         Name: client.Name[0],
//         Surname: client.Surname[0],
//         Address: client.Address[0],
//         Email: client.Email[0],
//         Phone: client.Phone[0],
//       };
//       system.System.Clients.push(newClient);
//     }
//     const builder = new Builder({ headless: true, rootName: "System" });
//     const xml = builder.buildObject(system.System);
//     // Запишување во System.xml
//     await fs.promises.writeFile("System-V2.xml", xml, "utf-8");
//     console.log("✅ Успешно споени фајловите во System.xml!");
//   } catch (error) {
//     console.error("❌ Грешка при спојување:", error);
//   }
// }
// mergeXMLFiles();
const fs_1 = __importDefault(require("fs"));
const xml2js_1 = require("xml2js");
// Helper function to read and parse XML file
async function parseXmlFile(filePath) {
    const xmlData = await fs_1.default.promises.readFile(filePath, "utf-8");
    return await (0, xml2js_1.parseStringPromise)(xmlData);
}
// Helper function to write XML file
function writeXmlFile(filePath, obj) {
    const builder = new xml2js_1.Builder();
    const xml = builder.buildObject(obj);
    return fs_1.default.promises.writeFile(filePath, xml);
}
// Main function to merge all XML files
async function mergeXmlFiles() {
    try {
        const [artistsData, albumsData, djData, groupsData, singersData, catalogData, rentData, clientData,] = await Promise.all([
            parseXmlFile("dataXml/Artists.xml"),
            parseXmlFile("dataXml/Albums.xml"),
            parseXmlFile("dataXml/DJ.xml"),
            parseXmlFile("dataXml/Groups.xml"),
            parseXmlFile("dataXml/Singers.xml"),
            parseXmlFile("dataXml/CatalogCD.xml"),
            parseXmlFile("dataXml/Rent.xml"),
            parseXmlFile("dataXml/Clients.xml"),
        ]);
        // Process artists data
        const artists = artistsData.ARTISTS.ARTIST.map((artist) => {
            const artistId = artist.$.ID;
            const artistType = determineArtistType(artistId, djData, groupsData, singersData);
            // Get artist details based on type
            let artistDetails = {};
            if (artistType === "DJ") {
                artistDetails = getDjDetails(artistId, djData);
            }
            else if (artistType === "Group") {
                artistDetails = getGroupDetails(artistId, groupsData);
            }
            else if (artistType === "Singer") {
                artistDetails = getSingerDetails(artistId, singersData);
            }
            // Get albums for this artist
            const albums = albumsData.ALBUMS.ALBUM.filter((album) => album.$.ARTIST_ID === artistId).map((album) => ({
                $: { id: album.$.ID },
                Title: album.NAME[0],
                ReleaseYear: album.RELEASE_YEAR ? album.RELEASE_YEAR[0] : undefined,
                Price: album.PRICE[0],
            }));
            return {
                $: {
                    id: artistId,
                    type: artistType,
                },
                Name: artist.NAME[0],
                Country: artist.COUNTRY[0],
                Genre: artist.GENRE,
                ...artistDetails,
                Albums: albums.length > 0 ? { Album: albums } : undefined,
            };
        });
        // Process clients data
        const clients = clientData.CLIENTS.CLIENT.map((client) => {
            const clientId = client.$.ID;
            // Handle different client structures
            const basicInfo = client.BASIC_INFO ? client.BASIC_INFO[0] : client;
            // Get rentals for this client
            const rentals = rentData.RENTS.RENT.filter((rent) => rent.$.CLIENT_ID === clientId).map((rent) => ({
                $: {
                    id: rent.$.ID,
                    returnState: normalizeReturnState(rent.RETURN_STATE ? rent.RETURN_STATE[0] : "0"),
                },
                AlbumID: rent.$.CD_ID,
                Date: rent.FROM_DATE[0],
                ReturnDate: rent.RETURN_DATE ? rent.RETURN_DATE[0] : undefined,
            }));
            return {
                $: { id: clientId },
                Name: basicInfo.NAME[0],
                Surname: basicInfo.SURNAME[0],
                Address: getAddress(basicInfo),
                Email: client.EMAIL ? client.EMAIL[0] : undefined,
                Phone: client.PHONE_NUMBER ? client.PHONE_NUMBER : undefined,
                Rentals: rentals.length > 0 ? { Rent: rentals } : undefined,
            };
        });
        // Process catalog data
        const catalogCD = catalogData.CATALOG.CD.map((cd) => ({
            $: {
                id: cd.$.ID,
                occupied: normalizeOccupiedStatus(cd.OCCUPIED ? cd.OCCUPIED[0] : "0"),
            },
            AlbumID: cd.$.ALBUM_ID,
            State: normalizeReturnState(cd.STATE ? cd.STATE[0] : "0"),
            Stock: 1, // Assuming each CD entry represents one stock
        }));
        // Create the final System.xml structure
        const systemXml = {
            System: {
                Artists: { Artist: artists },
                Clients: { Client: clients },
                CatalogCD: { CD: catalogCD },
            },
        };
        // Write the merged XML to file
        await writeXmlFile("System.xml", systemXml);
        console.log("Successfully created System.xml");
    }
    catch (error) {
        console.error("Error merging XML files:", error);
    }
}
// Helper functions
function determineArtistType(artistId, djData, groupsData, singersData) {
    if (djData.DJS.DJ.some((dj) => dj.$.ID === artistId))
        return "DJ";
    if (groupsData.GROUPS.GROUP.some((group) => group.$.ID === artistId))
        return "Group";
    if (singersData.SINGERS.SINGER.some((singer) => singer.$.ID === artistId))
        return "Singer";
    return "Artist"; // Default type
}
function getDjDetails(artistId, djData) {
    const dj = djData.DJS.DJ.find((dj) => dj.$.ID === artistId);
    return {
        YearStartedPerforming: dj.YEAR_STARTED_PERFORMING
            ? dj.YEAR_STARTED_PERFORMING[0]
            : undefined,
        NetWorth: dj.NET_WORTH ? dj.NET_WORTH[0] : undefined,
        YearOfBirth: dj.YEAR_OF_BIRTH ? dj.YEAR_OF_BIRTH[0] : undefined,
    };
}
function getGroupDetails(artistId, groupsData) {
    const group = groupsData.GROUPS.GROUP.find((group) => group.$.ID === artistId);
    return {
        YearFormed: group.YEAR_FORMED[0],
        NumberOfMembers: group.NUMBER_OF_MEMBERS[0],
    };
}
function getSingerDetails(artistId, singersData) {
    const singer = singersData.SINGERS.SINGER.find((singer) => singer.$.ID === artistId);
    return {
        YearStartedPerforming: singer.YEAR_STARTED_PERFORMING
            ? singer.YEAR_STARTED_PERFORMING[0]
            : undefined,
        YearOfBirth: singer.YEAR_OF_BIRTH ? singer.YEAR_OF_BIRTH[0] : undefined,
        Age: singer.AGE ? singer.AGE[0] : undefined,
    };
}
function normalizeReturnState(state) {
    switch (state) {
        case "0":
            return "functional";
        case "1":
            return "slightly damaged";
        case "2":
            return "damaged";
        default:
            return state; // already in text form
    }
}
function normalizeOccupiedStatus(status) {
    switch (status.toLowerCase()) {
        case "0":
        case "free":
            return "0";
        case "1":
        case "occupied":
            return "1";
        default:
            return status;
    }
}
function getAddress(client) {
    if (client.ADDRESS) {
        if (typeof client.ADDRESS === "string") {
            return client.ADDRESS[0];
        }
        else if (client.ADDRESS[0].STREET) {
            return `${client.ADDRESS[0].STREET[0].trim()} ${client.ADDRESS[0].NUMBER[0]}`;
        }
    }
    return undefined;
}
// Run the merge process
mergeXmlFiles();
