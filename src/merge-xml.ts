import fs from "fs";
import { parseStringPromise, Builder } from "xml2js";

async function parseXmlFile(filePath: string): Promise<any> {
  const xmlData = await fs.promises.readFile(filePath, "utf-8");
  return await parseStringPromise(xmlData);
}

function writeXmlFile(filePath: string, obj: any): Promise<void> {
  const builder = new Builder();
  const xml = builder.buildObject(obj);
  return fs.promises.writeFile(filePath, xml);
}

async function mergeXmlFiles() {
  try {
    const [
      artistsData,
      albumsData,
      djData,
      groupsData,
      singersData,
      catalogData,
      rentData,
      clientData,
    ] = await Promise.all([
      parseXmlFile("dataXml/Artists.xml"),
      parseXmlFile("dataXml/Albums.xml"),
      parseXmlFile("dataXml/DJ.xml"),
      parseXmlFile("dataXml/Groups.xml"),
      parseXmlFile("dataXml/Singers.xml"),
      parseXmlFile("dataXml/CatalogCD.xml"),
      parseXmlFile("dataXml/Rent.xml"),
      parseXmlFile("dataXml/Clients.xml"),
    ]);

    const artists = artistsData.ARTISTS.ARTIST.map((artist: any) => {
      const artistId = artist.$.ID;
      const artistType = determineArtistType(
        artistId,
        djData,
        groupsData,
        singersData
      );

      let artistDetails = {};
      if (artistType === "DJ") {
        artistDetails = getDjDetails(artistId, djData);
      } else if (artistType === "Group") {
        artistDetails = getGroupDetails(artistId, groupsData);
      } else if (artistType === "Singer") {
        artistDetails = getSingerDetails(artistId, singersData);
      }

      const albums = albumsData.ALBUMS.ALBUM.filter(
        (album: any) => album.$.ARTIST_ID === artistId
      ).map((album: any) => ({
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

    const clients = clientData.CLIENTS.CLIENT.map((client: any) => {
      const clientId = client.$.ID;

      const basicInfo = client.BASIC_INFO ? client.BASIC_INFO[0] : client;

      const rentals = rentData.RENTS.RENT.filter(
        (rent: any) => rent.$.CLIENT_ID === clientId
      ).map((rent: any) => ({
        $: {
          id: rent.$.ID,
          returnState: normalizeReturnState(
            rent.RETURN_STATE ? rent.RETURN_STATE[0] : "0"
          ),
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

    const catalogCD = catalogData.CATALOG.CD.map((cd: any) => ({
      $: {
        id: cd.$.ID,
        occupied: normalizeOccupiedStatus(cd.OCCUPIED ? cd.OCCUPIED[0] : "0"),
      },
      AlbumID: cd.$.ALBUM_ID,
      State: normalizeReturnState(cd.STATE ? cd.STATE[0] : "0"),
      Stock: 1,
    }));

    const systemXml = {
      System: {
        Artists: { Artist: artists },
        Clients: { Client: clients },
        CatalogCD: { CD: catalogCD },
      },
    };

    await writeXmlFile("dist/System.xml", systemXml);
    console.log("Successfully created System.xml");
  } catch (error) {
    console.error("Error merging XML files:", error);
  }
}

function determineArtistType(
  artistId: string,
  djData: any,
  groupsData: any,
  singersData: any
): string {
  if (djData.DJS.DJ.some((dj: any) => dj.$.ID === artistId)) return "DJ";
  if (groupsData.GROUPS.GROUP.some((group: any) => group.$.ID === artistId))
    return "Group";
  if (
    singersData.SINGERS.SINGER.some((singer: any) => singer.$.ID === artistId)
  )
    return "Singer";
  return "Artist";
}

function getDjDetails(artistId: string, djData: any) {
  const dj = djData.DJS.DJ.find((dj: any) => dj.$.ID === artistId);
  return {
    YearStartedPerforming: dj.YEAR_STARTED_PERFORMING
      ? dj.YEAR_STARTED_PERFORMING[0]
      : undefined,
    NetWorth: dj.NET_WORTH ? dj.NET_WORTH[0] : undefined,
    YearOfBirth: dj.YEAR_OF_BIRTH ? dj.YEAR_OF_BIRTH[0] : undefined,
  };
}

function getGroupDetails(artistId: string, groupsData: any) {
  const group = groupsData.GROUPS.GROUP.find(
    (group: any) => group.$.ID === artistId
  );
  return {
    YearFormed: group.YEAR_FORMED[0],
    NumberOfMembers: group.NUMBER_OF_MEMBERS[0],
  };
}

function getSingerDetails(artistId: string, singersData: any) {
  const singer = singersData.SINGERS.SINGER.find(
    (singer: any) => singer.$.ID === artistId
  );
  return {
    YearStartedPerforming: singer.YEAR_STARTED_PERFORMING
      ? singer.YEAR_STARTED_PERFORMING[0]
      : undefined,
    YearOfBirth: singer.YEAR_OF_BIRTH ? singer.YEAR_OF_BIRTH[0] : undefined,
    Age: singer.AGE ? singer.AGE[0] : undefined,
  };
}

function normalizeReturnState(state: string): string {
  switch (state) {
    case "0":
      return "functional";
    case "1":
      return "slightly damaged";
    case "2":
      return "damaged";
    default:
      return state;
  }
}

function normalizeOccupiedStatus(status: string): string {
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

function getAddress(client: any): string | undefined {
  if (client.ADDRESS) {
    if (typeof client.ADDRESS === "string") {
      return client.ADDRESS[0];
    } else if (client.ADDRESS[0].STREET) {
      return `${client.ADDRESS[0].STREET[0].trim()} ${
        client.ADDRESS[0].NUMBER[0]
      }`;
    }
  }
  return undefined;
}

mergeXmlFiles();
