xquery version "3.1";

<!-- a) Прикажи ги сите артисти (сите информации) заедно со насловите и датумите на издавање на сите албуми кои ги имаат снимено. -->
for $artist in doc("System.xml")//Artist
return
<ArtistInfo>
    {$artist/Name}
    {$artist/Country}
    {$artist/NetWorth}
    {$artist/YearBorn}
    {$artist/YearStarted}
    <Albums>
        {
            for $album in $artist/Albums/Album
            return
                <Album>
                    <Title>{$album/Title}</Title>
                    <ReleaseYear>{$album/ReleaseYear}</ReleaseYear>
                </Album>
        }
    </Albums>
</ArtistInfo>

<!-- b. Најди ги првите три члена со најголем број изнајмувања. -->
for $client in doc("System.xml")//Client
let $rentalCount := count($client/Rentals/Rent)
order by $rentalCount descending
where position() <= 3
return
<PopularClient>
    {$client/Name}
    <RentalsCount>{$rentalCount}</RentalsCount>
</PopularClient>

<!-- c. Врати ги сите албуми кои биле изнајмени најмалку три пати во периодот од јануари до март 2020.-->
for $album in doc("System.xml")//Album
let $rents := doc("System.xml")//Rent[AlbumID = $album/@id and xs:date(Date) ge xs:date('2020-01-01') and xs:date(Date) le xs:date('2020-03-31')]
where count($rents) >= 3
return
<PopularAlbum>
    {$album/Title}
    <TimesRented>{count($rents)}</TimesRented>
</PopularAlbum>

<!-- d. Прикажи го клиентот кој најмногу изнајмувал од најизнајмениот албум заедно со информациите за албумот-->
let $mostRentedAlbum := (
    for $album in doc("System.xml")//Album
    let $rents := doc("System.xml")//Rent[AlbumID = $album/@id]
    order by count($rents) descending
    return $album
)[1]

let $rentsForAlbum := doc("System.xml")//Rent[AlbumID = $mostRentedAlbum/@id]

let $topClient := (
    for $client in doc("System.xml")//Client
    let $clientRentCount := count($client/Rentals/Rent[AlbumID = $mostRentedAlbum/@id])
    order by $clientRentCount descending
    return $client
)[1]

return
<Result>
    {$topClient}
    <Album>{$mostRentedAlbum/Title}</Album>
</Result>

<!-- e. Прикажи го просечниот број на изнајмувања на секој албум посебно.-->
for $album in doc("System.xml")//Album
let $rentCount := count(doc("System.xml")//Rent[AlbumID = $album/@id])
return
<AlbumAverage>
    {$album/Title}
    <AverageRentals>{$rentCount}</AverageRentals>
</AlbumAverage>

<!-- f. Врати го вкупниот профит кој е направен за секој албум посебно.-->
for $album in doc("System.xml")//Album
let $rents := doc("System.xml")//Rent[AlbumID = $album/@id]
let $price := xs:decimal($album/Price)
let $totalProfit := $price * count($rents)
return
<AlbumProfit>
    {$album/Title}
    <Profit>{$totalProfit}</Profit>
</AlbumProfit>

<!-- g. Најди ја групата чиј албум е најмногу пати изнајмен, но постои барем едно CD кое во моментот не е изнајмено.-->
for $group in doc("System.xml")//Artist[@type="Group"]
let $groupAlbums := $group/Albums/Album
let $mostRentedAlbum := (
    for $album in $groupAlbums
    let $rentCount := count(doc("System.xml")//Rent[AlbumID = $album/@id])
    order by $rentCount descending
    return $album
)[1]
where some $cd in doc("System.xml")//CD[AlbumID = $mostRentedAlbum/@id] satisfies ($cd/@occupied = '0')
return
<Group>
    {$group/Name}
    <TopAlbum>{$mostRentedAlbum/Title}</TopAlbum>
</Group>

<!-- h. Прикажи ги сите клиенти кои барем еднаш изнајмиле CD во времетраење пократко од 10 дена.-->
for $client in doc("System.xml")//Client
where some $rent in $client/Rentals/Rent
      satisfies (xs:date($rent/ReturnDate) - xs:date($rent/Date) lt xs:dayTimeDuration('P10D'))
return
<Client>
    {$client/Name}
</Client>

<!-- i. Најди го омилениот артист на секој клиент посебно (сите информации за артистот од кој клиентот има изнајмено најмногу албуми, ако има повеќе вратете го првиот). -->
for $client in doc("System.xml")//Client
let $rents := $client/Rentals/Rent
let $favoriteArtist := (
    for $artist in doc("System.xml")//Artist
    let $artistAlbumIds := $artist/Albums/Album/@id
    let $clientRentsForArtist := count($rents[AlbumID = $artistAlbumIds])
    order by $clientRentsForArtist descending
    return $artist
)[1]
return
<FavoriteArtistOfClient>
    {$client/Name}
    {$favoriteArtist}
</FavoriteArtistOfClient>

<!-- j. Најди го најомилениот артист (артистот кој е омилен на најголемиот број клиенти).-->
let $favoriteArtists :=
    for $client in doc("System.xml")//Client
    let $rents := $client/Rentals/Rent
    let $favoriteArtist := (
        for $artist in doc("System.xml")//Artist
        let $artistAlbumIds := $artist/Albums/Album/@id
        let $clientRentsForArtist := count($rents[AlbumID = $artistAlbumIds])
        order by $clientRentsForArtist descending
        return $artist
    )[1]
    return $favoriteArtist

let $topArtist :=
    for $artist in distinct-values($favoriteArtists/@id)
    let $count := count($favoriteArtists[@id = $artist])
    order by $count descending
    return $artist
[1]

return
<MostFavoriteArtist>
    {doc("System.xml")//Artist[@id = $topArtist]}
</MostFavoriteArtist>

<!-- k. Напиши кориснички дефинирана функција за генерирање месечен извештај. Месецот и годината се задаваат како влезни параметри, а во извештајот за тековниот месец ќе се вратат профитот направен од сите албуми и бројот на продажби по албум за секој артист посебно.-->
declare function local:monthly-report($month as xs:integer, $year as xs:integer) {
    for $artist in doc("System.xml")//Artist
    let $albums := $artist/Albums/Album
    return
        <ArtistReport>
            {$artist/Name}
            {
                for $album in $albums
                let $sales := count(doc("System.xml")//Rent[
                    AlbumID = $album/@id and
                    year-from-date(xs:date(Date)) = $year and
                    month-from-date(xs:date(Date)) = $month
                ])
                let $profit := $sales * xs:decimal($album/Price)
                return
                    <AlbumSales>
                        {$album/Title}
                        <Sales>{$sales}</Sales>
                        <Profit>{$profit}</Profit>
                    </AlbumSales>
            }
        </ArtistReport>
};

local:monthly-report(3, 2020)
