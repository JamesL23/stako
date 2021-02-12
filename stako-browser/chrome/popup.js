window.addEventListener("load", init);

function init() {
  displayVisit();
  addButtonFunctionality();
  loadCarosel();
}

// update popup display with latest visit
function displayVisit () {
  chrome.storage.local.get(['visitList'], function(result){
      var visitList = result.visitList;
      var visit = {};
      //visit = visitList.pop();
      //console.log(visit);
      //visitList.push(visit);

      $('#url').text(visit.tabUrl);
      $('#timestamp').text(visit.timestamp);
  });
}

//This function allows the nickname and motto to be editable.
function addButtonFunctionality() {
  var nickname = document.getElementById("nickname");
  var motto = document.getElementById("motto");
  nickname.contentEditable = true;
  motto.contentEditable = true;
}

function loadCarosel() {
  chrome.storage.local.get(['STAKO_USER'], function(result) {
    var userData = result["STAKO_USER"];
    var nick = document.getElementById("nickname");
    var mot = document.getElementById("motto");
    var carousel = document.querySelector("#carouselContent > .carousel-inner");
    //TODO: Make weekly activity processing work for years besides 2021.
    var activityData = userData["activity"]["weekly_summary"]["2021"];
    nick.textContent = activityData.nickname;
    mot.textContent = activityData.moto;
    var weeks = Object.keys(activityData);
    var active = true;
    for(let week of weeks) {
      var tags = Object.keys(activityData[week]["top_tags"]);
      var tagData = activityData[week]["top_tags"];
      //Find the top two tags based on page visits.
      var tag1 = null;
      var pageVisits1 = null;
      var tag2 = null;
      var pageVisits2 = null;
      for(let tag of tags) {
        var currVisits = tagData[tag]["pages_visited"];
        if(!tag1 && !pageVisits1) {
          tag1 = tag;
          pageVisits1 = currVisits;
        } else if(currVisits >= pageVisits1) {
          tag2 = tag1;
          pageVisits2 = pageVisits1;
          tag1 = tag;
          pageVisits1 = currVisits;
        } else if(currVisits >= pageVisits2 || (!tag2 && !pageVisits2)) {
          tag2 = tag;
          pageVisits2 = currVisits;
        }
      }
      //How to handle case where the user hasn't registered any visits yet???
      var first_tag_div = createActivityDiv(tag1, pageVisits1);
      var second_tag_div = createActivityDiv(tag2, pageVisits2);
      addTagsToCarousel(carousel, first_tag_div, second_tag_div, active, week);
      if(active) {
        active = false;
      }
    }
  });
}

function addTagsToCarousel(carousel, first_tag_div, second_tag_div, active, week) {
  var slide = document.createElement("div");
  var tagsContainer = document.createElement("div");
  var tagAndDateContainer = document.createElement("div");
  var date = document.createElement("div");
  date.classList.add("date-div");
  date.textContent = "2021 - Week " + week;
  slide.classList.add("carousel-item", "text-center", "p-4");
  if(active) {
    slide.classList.add("active");
  }
  tagsContainer.append(first_tag_div);
  tagsContainer.append(second_tag_div);
  tagsContainer.classList.add("tags-container");
  tagAndDateContainer.classList.add("tags-date-container");
  tagAndDateContainer.appendChild(tagsContainer);
  tagAndDateContainer.appendChild(date);
  slide.append(tagAndDateContainer);
  carousel.append(slide);
}

function createActivityDiv(final_tag, final_pageVisits) {
  var weekly_section = document.createElement("div");
  weekly_section.classList.add("weekly-container");
  var tagName = document.createElement("a");
  var pageVisits = document.createElement("p");
  if(final_tag.length > 10) {
    tagName.textContent = final_tag.substring(0, 7) + "...";
  } else {
    tagName.textContent = final_tag;
  }
  tagName.href = "https://stackoverflow.com/tags/" + final_tag;
  pageVisits.textContent = final_pageVisits;
  trackClick(tagName);
  weekly_section.appendChild(pageVisits);
  weekly_section.appendChild(tagName);
  return weekly_section;
}

function trackClick(element) {
  //Tracks whether one of the elements of interest has been clicked on.
  element.addEventListener('click', function (e) {
    var link = "https://www.stako.org/chrome-extension";
    chrome.runtime.sendMessage({extensiondId: "background.js", type: "stackoverflow:click", url: element.href, ele: link}, function(response) {
      console.log(response.testType + " " + response.testURL);
    });
    chrome.tabs.create({url: element.href, active: true});
  });
}