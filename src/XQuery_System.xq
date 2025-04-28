let $artists :=
  (
    doc("Artists.xml")//Artist,
    doc("dataXml/DJ.xml")//Artist,
    doc("Groups.xml")//Artist,
    doc("Singers.xml")//Artist
  )

let $albums := doc("Albums.xml")//Album

let $clients := doc("Clients.xml")//Client

let $rents := doc("Rent.xml")//Rent

let $catalogCD := doc("CatalogCD.xml")//CD

return
<System>

  <Artists>
    {
      for $artist in $artists
      return
        <Artist id="{$artist/@id}" type="{$artist/@type}">
          {$artist/*} 
          {
            let $artistAlbums :=
              for $album in $albums
              where $album/ArtistID = $artist/@id
              return $album
            return
              if (exists($artistAlbums)) then
                <Albums>
                  {for $a in $artistAlbums return $a}
                </Albums>
              else ()
          }
        </Artist>
    }
  </Artists>

  <Clients>
    {
      for $client in $clients
      return
        <Client id="{$client/@id}">
          {$client/Name}
          {$client/Surname}
          {
            if ($client/Address) then $client/Address else ()
          }
          {$client/Email}
          {
            for $phone in $client/Phone
            return $phone
          }
          <Rentals>
            {
              for $rent in $rents
              where $rent/ClientID = $client/@id
              return
                <Rent id="{$rent/@id}" returnState="{$rent/@returnState}">
                  <AlbumID>{$rent/AlbumID/text()}</AlbumID>
                  <Date>{$rent/Date/text()}</Date>
                  {
                    if ($rent/ReturnDate) then <ReturnDate>{$rent/ReturnDate/text()}</ReturnDate> else ()
                  }
                </Rent>
            }
          </Rentals>
        </Client>
    }
  </Clients>

  <CatalogCD>
    {
      for $cd in $catalogCD
      return
        <CD id="{$cd/@id}" occupied="{$cd/@occupied}">
          {$cd/*}
        </CD>
    }
  </CatalogCD>

</System>
