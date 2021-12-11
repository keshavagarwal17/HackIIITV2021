import React, { useEffect, useState, useContext } from "react";
import "./ProductPage.scss";
import { useParams } from "react-router-dom";
import {
  Container,
  Segment,
  Header,
  Button,
  Modal,
  Form,
  Icon,
  Dropdown
} from "semantic-ui-react";
import DOMPurify from "dompurify";
import toast, { Toaster } from "react-hot-toast";
import { EditorState } from "draft-js";
// import { options } from "../../../Content/Profile";
import { convertToHTML } from "draft-convert";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { create } from "ipfs-http-client";
import IPFS from "ipfs-mini";
import product from "../../ethereum/product";
import web3 from '../../ethereum/web3'
import Review from './Review/Review'

const IdeaPage = () => {
    const [client, setClient] = useState(null);
    const [open, setOpen] = useState(false)
    const [ipfsInstance, setIpfsInstance] = useState(null);
    const [allReviewers, setAllReviewers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentAddress, setCurrentAddress] = useState("");
    const { productAddress } = useParams();
    // const [review, setReview] = useState({ title: "", description: "" });
    const [productInstance, setProductInstance] = useState();
    const [allReviews, setALlReviews] = useState([]);
    const [productSummary, setProductSummary] = useState({
      title: '',
      link: '',
      descp: '',
      amt: '',
      reviewLength: '',
    });
    const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );
  const [currentAccount, setCurrentAccount] = useState("");

  const setAccount = async () => {
    const accounts = await web3.eth.getAccounts();
    setCurrentAccount(accounts[0]);
   }

  useEffect(() => {
    setAccount()
  },[])

  const [review, setReview] = useState({
    bestpart: '',
    improvement: '',
    stuck: '',
    rating: 0,
    recommend: '',
    bug: ''
  })

  useEffect(() => {
    const ipfs = new IPFS({
      host: "ipfs.infura.io",
      port: 5001,
      protocol: "https"
    });
    setIpfsInstance(ipfs);
  },[])

  useEffect(() => {
    try {
      console.log(" this is called ", productSummary.reviewLength);
      const reviews = [];
      const reviewLengthArray = Array.from(
        Array(productSummary.reviewLength).keys()
      );
      const productInstance = product(productAddress);
      reviewLengthArray.map(async (i) => {
        
        const particularReview = await productInstance.methods.reviews(i).call();
        reviews.push(particularReview);
        console.log(particularReview);
        // setALlReviews((allReviews) => [...allReviews, particularReview]);
      });
      setALlReviews(reviews)
      console.log(allReviews)
    } catch (err) {
      console.log(err.message);
    }
  }, [productSummary]);

  const setProduct = async () => {
       // console.log(" this is user age ", age);
       setCurrentAddress(productAddress);
       console.log(currentAddress);
       console.log(productAddress)
       const productInstance = product(productAddress);
       setProductInstance(productInstance);
       const productInfo = await productInstance.methods.getSummary().call();
       console.log(productInfo)
       const addressOfReviewers = await productInstance.methods.getAllReviewers().call();
       setAllReviewers(addressOfReviewers);
       setProductSummary({
        title: productInfo[0],
        description: productInfo[1],
        link: productInfo[2],
        amt: productInfo[4],
        reviewLength: productInfo[7],
      });
       console.log("this are address opf reviews", addressOfReviewers)
  }

  useEffect(() => {
    setProduct()
  }, []);

  const setReviewValues = (e) => {
    setReview({ ...review, [e.target.name]: e.target.value });
    console.log("setting review", review)
  };

    const setDropdownValues = (e, data) => {
    setReview({ ...review, [data.name]: data.value });
  };


  const [convertedContent, setConvertedContent] = useState(null);

  const handleEditorChange = (state) => {
    setEditorState(state);
    convertContentToHTML();
  };

  const convertContentToHTML = () => {
    const currentContentAsHTML = convertToHTML(editorState.getCurrentContent());
    setConvertedContent(currentContentAsHTML);
    console.log(convertedContent);
  };
  const boolOptions = [
    { key: "yes", text: "yes" },
    { key: "no", text: "no" }
  ]
  const createMarkup = (html) => {
    return {
      __html: DOMPurify.sanitize(html),
    };
  };

  const addReviewToNetwork = async (reviewId) => {
    try {
      await productInstance.methods.addReview(reviewId).send({
        from: currentAccount
      })
      setProduct()
    } catch(err) {
      console.log(err.message)
    }
  }

  const addReview = async () => {
    setReview({
      ...review, bug: convertedContent
    })
    const reviewId = await ipfsInstance.addJSON(review);
    console.log("cid", reviewId)
    console.log("final review", reviewId)
    addReviewToNetwork(reviewId)
  }


  return (
    <>
      <Toaster />
      <Container style={{ marginTop: "20px" }}>
        <Segment>
          <b>Title: </b>
          {productSummary.title}
        </Segment>
        <Segment>
          <b>Description along with installation and usage: </b> <br />
          <div
            className="preview"
            dangerouslySetInnerHTML={createMarkup(productSummary.description)}
          ></div>
        </Segment>
        <Segment>
          <b>Link to Product: </b>{productSummary.link} <br />
        </Segment>
        <Segment>
          <b>Managed by:</b> this we need to work on
        </Segment>
        {/* <Header as="h1">All Reviews</Header> */}
        <Segment>
          <Modal
            closeIcon
            open={open}
            trigger={
              <Button color="green" icon="add">
                Add your review
              </Button>
            }
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
          >
            <Header as="h2" content="Add your review" />
            <Modal.Content>
              <Form>
                <Form.Field>
                  <label> Best part of our product which you like </label>
                  <textarea
                    name="bestpart"
                    type="text"
                    onChange={(e) =>
                      setReviewValues(e)
                    }
                  />
                  <label> What can be improved further </label>
                  <textarea
                    name="improvement"
                    type="text"
                    onChange={(e) =>
                      setReviewValues(e)
                    }
                  />
                  
                  <label> Did it stuck any where while using it </label>
                  <textarea
                    name="stuck"
                    type="text"
                    onChange={(e) => setReviewValues(e)}
                  />
                  
                  <label> How much you will rate on rating on 10 </label>
                  <input
                    name="rating"
                    type="number"
                    onChange={(e) =>
                      setReviewValues(e)
                    }
                  />
                  
                  <label> Would you recommend this to your friend </label>
                  <Dropdown
                placeholder="select"
                name="recommend"
                fluid
                selection
                clearable
                onChange={(e, data) => setDropdownValues(e, data)}
                options={boolOptions}
              />
                  
                  <label> If you find any bug do mention it along with it's screenshots </label>
                  <Editor
                editorState={editorState}
                onEditorStateChange={handleEditorChange}
                wrapperClassName="wrapper-class"
                editorClassName="editor-class"
                toolbarClassName="toolbar-class"
              />
                </Form.Field>
              </Form>
            </Modal.Content>
            <Modal.Actions>
              <Button
                color="green"
                onClick={() => addReview()}
              >
                <Icon name="add" /> Add Review
              </Button>
            </Modal.Actions>
          </Modal>
        </Segment>
        <Segment>
        {allReviews.map((element, index) => {
            return (
              <Review
                key={index}
                data={element}
                index={index}
                // ideaAddress={ideaAddress}
                allReviewers={allReviewers}
                isAdmin={false}
              />
            );
          })}
        </Segment>
      </Container>
    </>
  );
};

export default IdeaPage;