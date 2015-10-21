var fs   = require('fs');
var http = require('http');


if (process.argv.length <= 2) {
    console.log("Usage: " + __filename + " URL");
    process.exit(-1);
}
 
var arrayOfUrls = [];
var topUrl      = process.argv[2];
var thisDomain  = topUrl.replace('http://','');
    thisDomain  = thisDomain.replace('https://',''); 


//
console.log('\r\r\r\r');
console.log('######################################################');
console.log('Domain:' + thisDomain);
console.log('######################################################');


function everythingDoneShutDown()
{console.log('########### Shutting Down ############');
 process.exit(0);
};



function saveSitemapFile()
{
 var fileHeader  = '<?xml version="1.0" encoding="UTF-8"?>';
 var urlSetOpen  = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
 var urlSetClose = '</urlset>';
 var urlOpen     = '<url>';


 var stream = fs.createWriteStream("sitemap.xml");

 stream.once('close', everythingDoneShutDown);
 stream.once('open', function(fd) 
 {stream.write(fileHeader + '\n');
  stream.write(urlSetOpen + '\n');

  for(var cnt=0;cnt < arrayOfUrls.length;cnt++)
     {//console.log(cnt + ':' + arrayOfUrls[cnt]);
      stream.write('<loc>' + arrayOfUrls[cnt] +  '</loc>\n');
     }
  stream.write(urlSetClose + '\n');
  stream.end();
 });


 // console.log('Total Urls:' + arrayOfUrls.length);
};


var scrapeCnt = 0;
var scrapeBusy= 0;

function scrape(url)
{console.log('Scraping:' + url);
 scrapeBusy++;
 scrapeCnt++;
 
 http.get(url, function(res) 
     {//console.log("Got response: " + res.statusCode);
      var content = '';
      res.on('data', function(chunk) 
         {//console.log('chunk ' + chunk.length);
          content += chunk;
         });
      res.on('end', function() 
         {content = content.toLowerCase();

          // get href
          var hrefMatch = content.match(/href="([^\'\"]+)/g);
          if(hrefMatch)
            {// found something in this page
             for(var cnt=0; cnt < hrefMatch.length; cnt++)
                {hrefMatch[cnt] = hrefMatch[cnt].replace('href="', '');
                 if(arrayOfUrls.indexOf(hrefMatch[cnt]) == -1)
                   {arrayOfUrls.push(hrefMatch[cnt]);
                    // if now a file then crawl down
                    if(!hrefMatch[cnt].match(/\.(doc|js|css|jpg|png|gif)\b/))
                      {// check to make sure link is not external 
                       if(hrefMatch[cnt].indexOf(topUrl) > -1)
                         {scrape(hrefMatch[cnt]);
                         }
                      }
                   }
                }
            }

         // get src 
         var srcMatch = content.match(/src="([^\'\"]+)/g);
         if(srcMatch)
           {// found something in this page
            for(var cnt=0; cnt < srcMatch.length; cnt++)
               {srcMatch[cnt] = srcMatch[cnt].replace('src="', '');
                if(arrayOfUrls.indexOf(srcMatch[cnt]) == -1)
                  {arrayOfUrls.push(srcMatch[cnt]);
                  }
               }
           }

        scrapeBusy--;
        });
     }).on('error', function(e) { console.log("Got error: " + e.message);});
};


function monitorScrape()
{if(scrapeCnt > 0 )
   {if(scrapeBusy < 1)
      {console.log('######## DONE ######');
       saveSitemapFile();
       scrapeCnt = 0;
      }
    else
      {console.log('Busy:' + scrapeCnt);
      }
   }
};

setInterval(monitorScrape, 100);
scrape(topUrl);










