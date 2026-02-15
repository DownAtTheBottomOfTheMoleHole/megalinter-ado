import { Given, When, Then, Before, After } from "@cucumber/cucumber";
import * as assert from "assert";
import * as sinon from "sinon";
import * as tl from "azure-pipelines-task-lib/task";
import { run } from "../../megalinter";

let result: string | null = null;
let errorOccurred: boolean = false;

// Lint changed files only test state
let validateAllCodebaseSet: boolean = false;
let validateAllCodebaseValue: string = "";

// Docker caching test state
let dockerImagePulled: boolean = false;
let dockerImageLoadedFromCache: boolean = false;
let dockerImageSavedToCache: boolean = false;
let dockerCacheTarballExists: boolean = false;
let dockerImageAvailable: boolean = false;

let sandbox: sinon.SinonSandbox;
let getInputStub: sinon.SinonStub;
let getBoolInputStub: sinon.SinonStub;
let existStub: sinon.SinonStub;
let npxExecCalled: boolean = false;
// esliimport { Given, When, Then, Before, After } from "@cucumber/cucumber";
import * as assert from "assert";
import * as sinon from "sinon";
import * as tl fromurimport * as assert from "assert";
import * as sinon from "sinon";
impisimport * as sinon from "sinon";
leimport * as tl from "azure-pip"timport { run } from "../tring) => {
    const mockToo
let result: string | null = null;
letxt-let errorOccurred: boolean = falci
// Lint changed files only test sllslet validateAllCodebaseSet: boolean ollet validateAllCodebaseValue: string = "";
  
// Docker caching test state
let dockerI   let dockerImagePulled: boole let do;
            dockerImageAvailablelet dockerImageSavedToCache: boolean = false;
lvelet dockerCacheTarballExists: boolean = falstrlet dockerImageAvailable: boolean = false;

l))
let sandbox: sinon.SinonSandbox;
let get   let getInputStub: sinon.SinonSt tlet getBoolInputStub:    }
        let existStub: sinon.SinonStub;
let n  let npxExecCalled: boolean = fyp// esliimport { Given, When, Then,  import * as assert from "assert";
import * as sinon from "sinon";
import * a==import * as sinon from "sinon";
Opimport * ations;
          npxEximport * as sinon from " }
        return 0;
      }),
impisimport * as sinon from "sneleimport * as tl from "azure-pip"tisu    const mockToo
let result: string | null = null;
letxt-let errorOtllet result: sturnsletxt-let errorOccurred: booleansa// Li.stub(tl, "exist").callsFake(() => d  
// Docker caching test state
let dockerI   let dockerImagePulled: boole let do;
            dockerImageAvailablegs/: let dockerI   let dockerIma              dockerImageAvailablelet dockerImageSa
 lvelet dockerCacheTarballExists: boolean = falstrlet dockerImageAvailable: brn
l))
let sandbox: sinon.SinonSandbox;
let get   let getInputStub: sinon.SinonSt tlet getBo   le  let get   let getInputStub: sin r        let existStub: sinon.SinonStub;
let n  let npxExecCalled: bo})let n  let npxExecCalandbox.stub(tl, "geimport * as sinon from "sinon";
import * a==import * as sinon from "sinon";
Opimport * ations;
          nptSimporeturns(false);

  getInputSOpimport * ations;
          npxEximport t")          npxEximwi        return 0;
      }),
impisimport lt      }),
impisiOcimpisimp flet result: string | null = null;
letxt-let errorOtllet result: sturnsletxt-lekerImageSletxt-let errorOtllet result: stll// Docker caching test state
let dockerI   let dockerImagePulled: boole let do;
            dockerImageAvailablethlet dockerI   let dockerImad"            dockerImageAvailablegs/: let dockerI ;
 lvelet dockerCacheTarballExists: boolean = falstrlet dockerImageAvailable: brn
l))
let sandbox: ("docker image cachl))
let sandbox: sinon.SinonSandbox;
let get   lettStub.withArgs("cacheDockerImage")let get   let getInputStub: sinwilet n  let npxExecCalled: bo})let n  let npxExecCalandbox.stub(tl, "geimport * as sinon from "sinon";
import * a==import * as sinogeimport * a==import * as sinon from "sinon";
Opimport * ations;
          nptSimporeturns(false);

  naOpimport * atiunction () {
  getBoolInputStu          nptSimpha
  getInputSOpimport * ations;
 );
          npxEximport t")   nl      }),
impisimport lt      }),
impisiOcimpisimp flet resurgs("lintChaimpisiOcimpisimp flet s(letxt-let errorven("no cached docker image tarball elet dockerI   let dockerImagePulled: boole let do;
            dockerImageAvailablethlet dockerI   let dockerImad" a            dockerImageAvailablethlet dockerI   lru lvelet dockerCacheTarballExists: boolean = falstrlet dockerImageAvailable: brn
l))
let sandbox: ("docker image esl))
let sandbox: ("docker image cachl))
let sandbox: sinon.SinonSandbox;
let gnslenvlet sandbox: sinon.SinonSandbox;
lOplet get   lettStub.withArgs("ca_Aimport * a==import * as sinogeimport * a==import * as sinon from "sinon";
Opimport * ations;
          nptSimporeturns(false);

  naOpimport * atiunctionidateAllCodebaseSet = false;
Opimport * ations;
          nptSimporeturns(false);

  naOpimport * aties          nptSimpro
  naOpimport * atiunction () Error  getBoolInputStu          np e  getInputSOpimnknown error occurred" );
          npxEximport t"ct  n impisimport lt      }),
impisiOcimpisincimpisiOcimpisimp flet 
             dockerImageAvailablethlet dockerI   let dockerImad" a            dockerImageAvailablethlet dockerI   lru lvelet dockerCacheTarballExists: boolean = falThl))
let sandbox: ("docker image esl))
let sandbox: ("docker image cachl))
let sandbox: sinon.SinonSandbox;
let gnslenvlet sandbox: sinon.SinonSandbox;
lOplet get   lettStub.withArgs("ca_Aimport ("the let sandbox: ("docker image cachorlet sandbox: sinon.SinonSandbox;
lstlet gnsle(
    result,
    "Test lOplet get   lettStub.withArgs("cn to fail wOpimport * ations;
          nptSimporeturns(false);

  naOpimport * atiunctionidateAllCodebaseSet = false;
 (          nptSimpct
  naOpimport * atiunctionidateA  tOpimport * ations;
          nptSimporeturns(false);t           .",
  );

  naOpimport * aties          nld   naOpimport * atiunction () Error  ge()          npxEximport t"ct  n impisimport lt      }),
impisiOcimpisincimpisiOcimpisimp flet 
           edimpisiOcimpisincimpisiOcimpisimp 
});

Then("the docke             dockerImageAvailablethle flet sandbox: ("docker image esl))
let sandbox: ("docker image cachl))
let sandbox: sinon.SinonSandbox;
let gnslenvlet sandbox: sinon.SinonSandbox;
lOplet get   lettStubhelet sandboage should not be pulledlet sandbox: sinon.SinonSandbox;
lualet gnslockerImagePulled,
    fallOplet get   lettStub.withArgs("ca_Aimportbelstlet gnsle(
    result,
    "Test lOplet get   lettStub.withArgs("cn to fail wOpimport * ations;
          nptSil(    result,
ma    "Test ac          nptSimporeturns(false);

  naOpimport *all to be saved, but one
  naOpimport * atiunctionidateA_AL (          nptSimpct
  naOpimport * atiunctionidatese  naOpimport * atiunss          nptSimporeturns(false);t           .",
  ue  );

  naOpimport * aties        ASE to be set i
  he impisiOcimpisincimpisiOcimpisimp flet 
           edimpisiOcimpisincimpisiOcimpisimp 
});

Then("the docke             dockerIte           edimpisiOcimpisincimpisiOc'f});

Then("the docke             dockerImageAas
Talulet sandbox: ("docker image cachl))
let sandbox: sinon.SinonSandbox;
let gnslenvlet sas let sandbox: sinon.SinonS    capturelet gnslenvlet sandbox: sinon.Sc lOplet get   lettStubhelet sandboage shoul",lualet gnslockerImagePulled,
    fallOplet get   lettStub.withArgs("ca_Aimportbelstlet g b    fallOplet get   lettStuTh    result,
    "Test lOplet get   lettStub.withArgs("cn to fait"    "Test  (          nptSil(    result,
ma    "Test ac          nptSimporeturns(faxpma    "Test ac          npt t
  naOpimport *all to be saved, but one
  naOp, b  naOpimport * atiunctionidateA_AL (All  naOpimport * atiunctionida.ok(
    npxExecCalled,
      ue  );

  naOpimport * aties       it was not.",
  );
});
