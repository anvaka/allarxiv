var fs = require('fs');
var fileName = process.argv[2];
var save = require('ngraph.tobinary');

if (!fileName) {
  console.log('pass the paperscape data file as a first argument here');
  process.exit(1);
}

var createGraph = require('ngraph.graph');
var graph = createGraph({ uniqueLinkIds: false });
var useAuthors = false;

var lineReader = require('readline').createInterface({
  input: fs.createReadStream(fileName)
});

lineReader.on('line', function (line) {
  if (!line || line[0] === '#') return; // skip comments

  var parts = line.split(';');
  // arxiv-id;comma-separated-arxiv-categories;num-found-refs;num-total-refs;comma-separated-refs;comma-separated-authors;title

  if (useAuthors) {
    addAuthors(parts[5].split(','), graph);
  } else {
    var fromId = parts[0];
    addCitations(fromId, parts[4].split(','), graph);
  }
});

lineReader.on('close', function() {
  console.log('nodes: ', graph.getNodesCount());
  console.log('edges: ', graph.getLinksCount());
  console.log('saving graph');
  save(graph, { outDir: './data' });

  console.log('All done. Now run layout++ from ngraph.native. e.g. layout++ ./data/links.bin');
});

function addCitations(fromId, citations, graph) {
  citations.forEach(function(citation) {
    graph.addLink(fromId, citation);
  });
}

function addAuthors(authors, graph) {
  authors.forEach(function(author) {
    graph.addNode(author);
  });

  for (var i = 0; i < authors.length; ++i) {
    for (var j = i + 1; j < authors.length; ++j) {
      if (i !== j && !graph.hasLink(authors[i], authors[j])) {
        graph.addLink(authors[i], authors[j]);
      }
    }
  }
}
